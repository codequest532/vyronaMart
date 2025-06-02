import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useLocation } from "wouter";

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
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

  const { data: sellerProducts } = useQuery({
    queryKey: ["/api/seller/products"],
  });

  const { data: sellerOrders } = useQuery({
    queryKey: ["/api/seller/orders"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/seller/analytics"],
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
    console.log("Opening bulk upload");
    
    const uploadSource = prompt(`Bulk Upload Options:\n\n1. Local System Files\n2. Google Drive Integration\n3. Dropbox Integration\n\nChoose source (1-3):`);
    
    if (uploadSource === '1') {
      // Local system bulk upload
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.epub,.mobi';
      fileInput.multiple = true;
      
      fileInput.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;
        
        const fileCount = files.length;
        const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        
        alert(`System Files Selected:\n\nFiles: ${fileCount} e-books\nTotal Size: ${totalSizeMB}MB\n\nProcessing bulk upload...`);
        
        setTimeout(() => {
          alert(`Bulk Upload Complete!\n\n${fileCount} files uploaded successfully\nAll books ready for metadata entry\nEstimated processing time: ${Math.ceil(fileCount * 0.3)} minutes`);
        }, 2000);
      };
      
      fileInput.click();
    } else if (uploadSource === '2') {
      // Google Drive integration
      alert(`Google Drive Integration\n\nConnecting to Google Drive...\nPlease authorize VyronaRead to access your Drive\n\nRedirecting to Google authentication...`);
      
      setTimeout(() => {
        const folderPath = prompt("Enter Google Drive folder path or paste folder link:");
        if (folderPath) {
          const estimatedFiles = Math.floor(Math.random() * 20) + 5;
          alert(`Google Drive Sync Initiated\n\nFolder: ${folderPath}\nScanning for e-books...\nFound: ${estimatedFiles} compatible files\n\nDownloading and processing files...`);
          
          setTimeout(() => {
            alert(`Google Drive Upload Complete!\n\n${estimatedFiles} files synced successfully\nAll books imported to your store\nMetadata extraction in progress...`);
          }, 3000);
        }
      }, 1500);
    } else if (uploadSource === '3') {
      // Dropbox integration
      alert(`Dropbox Integration\n\nConnecting to Dropbox...\nPlease authorize VyronaRead access\n\nOpening Dropbox authentication...`);
      
      setTimeout(() => {
        const folderPath = prompt("Enter Dropbox folder path:");
        if (folderPath) {
          const estimatedFiles = Math.floor(Math.random() * 15) + 3;
          alert(`Dropbox Sync Started\n\nFolder: ${folderPath}\nScanning for e-books...\nFound: ${estimatedFiles} files\n\nSyncing to VyronaRead...`);
        }
      }, 1500);
    }
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
              <Button onClick={() => setLocation("/vyronahub")}>
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
              VyronaRead Books
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
                      onClick={() => setLocation("/vyronahub")}
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
                <Button onClick={() => setLocation("/vyronahub")}>
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
                      <Button onClick={() => setLocation("/vyronahub")}>
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
                  {/* Combined Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Physical Books</p>
                            <p className="text-3xl font-bold text-blue-600">250</p>
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
                            <p className="text-3xl font-bold text-purple-600">1,450</p>
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
                            <p className="text-sm font-medium text-gray-600">Active Readers</p>
                            <p className="text-3xl font-bold text-green-600">3,280</p>
                            <p className="text-xs text-green-500">Monthly users</p>
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
                            <p className="text-3xl font-bold text-orange-600">₹85,450</p>
                            <p className="text-xs text-orange-500">This month</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-orange-600" />
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
                            <span className="text-sm">Books on Loan</span>
                            <span className="font-bold text-orange-600">65</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Membership Revenue</span>
                            <span className="font-bold text-green-600">₹12,500</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Late Fees</span>
                            <span className="font-bold text-red-600">₹850</span>
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
                            <span className="text-sm">E-book Sales</span>
                            <span className="font-bold text-purple-600">₹45,200</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Rental Revenue</span>
                            <span className="font-bold text-blue-600">₹18,900</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Subscription Income</span>
                            <span className="font-bold text-green-600">₹8,000</span>
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
                  {/* Book Library Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Books</p>
                        <p className="text-3xl font-bold text-blue-600">250</p>
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
                        <p className="text-3xl font-bold text-green-600">185</p>
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
                        <p className="text-sm font-medium text-gray-600">On Loan</p>
                        <p className="text-3xl font-bold text-orange-600">65</p>
                        <p className="text-xs text-orange-500">Currently borrowed</p>
                      </div>
                      <UserCheck className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-3xl font-bold text-red-600">8</p>
                        <p className="text-xs text-red-500">Need attention</p>
                      </div>
                      <Clock className="h-8 w-8 text-red-600" />
                    </div>
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
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest library transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">The Great Gatsby returned</p>
                          <p className="text-xs text-gray-500">Member: John Doe - 2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">1984 issued to Sarah Smith</p>
                          <p className="text-xs text-gray-500">Due: Jan 15, 2025 - 15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New book added: Digital Marketing</p>
                          <p className="text-xs text-gray-500">Added to Business section - 1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Book Inventory Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Book Inventory</CardTitle>
                  <CardDescription>Manage your library collection and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample Book Entries */}
                    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Book className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">The Psychology of Money</h3>
                              <p className="text-sm text-gray-600 mb-2">by Morgan Housel</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Business</Badge>
                                <Badge variant="secondary">ISBN: 978-0857197689</Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Copies: 3</span>
                                <span className="text-sm text-green-600">Available: 2</span>
                                <span className="text-sm text-orange-600">On Loan: 1</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewBook("The Psychology of Money")}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteBook("The Psychology of Money")}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleIssueBook("The Psychology of Money")}
                                className="text-green-600 hover:text-green-700 hover:border-green-300"
                              >
                                <Book className="h-4 w-4 mr-1" />
                                Issue
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Book className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Atomic Habits</h3>
                              <p className="text-sm text-gray-600 mb-2">by James Clear</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Self-Help</Badge>
                                <Badge variant="secondary">ISBN: 978-0735211292</Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Copies: 5</span>
                                <span className="text-sm text-green-600">Available: 3</span>
                                <span className="text-sm text-orange-600">On Loan: 2</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewBook("Atomic Habits")}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteBook("Atomic Habits")}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleIssueBook("Atomic Habits")}
                                className="text-green-600 hover:text-green-700 hover:border-green-300"
                              >
                                <Book className="h-4 w-4 mr-1" />
                                Issue
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow border-red-200 bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Book className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">The Lean Startup</h3>
                              <p className="text-sm text-gray-600 mb-2">by Eric Ries</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Business</Badge>
                                <Badge variant="secondary">ISBN: 978-0307887894</Badge>
                                <Badge variant="destructive">Overdue</Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Copies: 2</span>
                                <span className="text-sm text-gray-600">Available: 0</span>
                                <span className="text-sm text-red-600">On Loan: 2 (1 overdue)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleFollowUp("The Lean Startup")}
                                className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Follow Up
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteBook("The Lean Startup")}
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
                      <h4 className="font-semibold">Revenue Streams</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Membership Fees</span>
                          <span className="font-bold text-green-600">₹12,500/month</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Late Fees</span>
                          <span className="font-bold text-orange-600">₹850/month</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Digital Access</span>
                          <span className="font-bold text-blue-600">₹3,200/month</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Revenue</span>
                            <span className="font-bold text-green-600">₹16,550/month</span>
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

                  {/* E-Book Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Listed E-books</p>
                            <p className="text-3xl font-bold text-purple-600">1,450</p>
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
                            <p className="text-sm font-medium text-gray-600">Sales This Month</p>
                            <p className="text-3xl font-bold text-green-600">285</p>
                            <p className="text-xs text-green-500">Books sold</p>
                          </div>
                          <ShoppingCart className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                            <p className="text-3xl font-bold text-blue-600">156</p>
                            <p className="text-xs text-blue-500">Currently rented</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Revenue</p>
                            <p className="text-3xl font-bold text-orange-600">₹72,100</p>
                            <p className="text-xs text-orange-500">This month</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* E-Book Management */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Popular E-Books</CardTitle>
                        <CardDescription>Your best-selling digital books</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="w-12 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">The Psychology of Money</h4>
                              <p className="text-sm text-gray-600">by Morgan Housel</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="secondary">Business</Badge>
                                <span className="text-sm font-medium text-green-600">₹299 Sale</span>
                                <span className="text-sm font-medium text-blue-600">₹49/month Rent</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Sales: 45</p>
                              <p className="text-sm text-gray-600">Rentals: 23</p>
                              <p className="text-sm font-bold text-green-600">₹14,850</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="w-12 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">Atomic Habits</h4>
                              <p className="text-sm text-gray-600">by James Clear</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="secondary">Self-Help</Badge>
                                <span className="text-sm font-medium text-green-600">₹349 Sale</span>
                                <span className="text-sm font-medium text-blue-600">₹59/month Rent</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Sales: 38</p>
                              <p className="text-sm text-gray-600">Rentals: 19</p>
                              <p className="text-sm font-bold text-green-600">₹14,383</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="w-12 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">Think and Grow Rich</h4>
                              <p className="text-sm text-gray-600">by Napoleon Hill</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="secondary">Business</Badge>
                                <span className="text-sm font-medium text-green-600">₹249 Sale</span>
                                <span className="text-sm font-medium text-blue-600">₹39/month Rent</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Sales: 32</p>
                              <p className="text-sm text-gray-600">Rentals: 15</p>
                              <p className="text-sm font-bold text-green-600">₹8,553</p>
                            </div>
                          </div>
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
                          <Button variant="outline" className="w-full" onClick={handleBulkUpload}>
                            <Upload className="h-4 w-4 mr-2" />
                            Bulk Upload
                          </Button>
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
                        <div className="space-y-4">
                          <h4 className="font-semibold">Sales Revenue</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Book Sales</span>
                              <span className="font-bold text-green-600">₹45,200</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Platform Fee (15%)</span>
                              <span className="font-bold text-red-600">-₹6,780</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Net Sales</span>
                                <span className="font-bold text-green-600">₹38,420</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold">Rental Revenue</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Monthly Rentals</span>
                              <span className="font-bold text-blue-600">₹18,900</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Platform Fee (10%)</span>
                              <span className="font-bold text-red-600">-₹1,890</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Net Rentals</span>
                                <span className="font-bold text-blue-600">₹17,010</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold">Subscription Revenue</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Premium Access</span>
                              <span className="font-bold text-purple-600">₹8,000</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Platform Share</span>
                              <span className="font-bold text-green-600">₹8,000</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Total</span>
                                <span className="font-bold text-orange-600">₹63,430</span>
                              </div>
                            </div>
                          </div>
                        </div>
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
                            <span className="text-sm">Active Readers</span>
                            <span className="font-bold text-blue-600">3,280</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Daily Reading Time</span>
                            <span className="font-bold text-green-600">2.5 hrs avg</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Books Completed</span>
                            <span className="font-bold text-purple-600">1,256 this month</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Engagement Rate</span>
                            <span className="font-bold text-orange-600">78%</span>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-semibold mb-3">Popular Reading Features</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Night Mode</span>
                              <span className="font-medium">95% users</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Bookmarks</span>
                              <span className="font-medium">87% users</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Highlights</span>
                              <span className="font-medium">65% users</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Notes</span>
                              <span className="font-medium">42% users</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Reader Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Reader Interface Preview</CardTitle>
                      <CardDescription>VyronaRead in-house reading experience</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border-2 border-dashed">
                        <div className="max-w-2xl mx-auto">
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                                <span className="font-semibold">The Psychology of Money</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-4 text-sm leading-relaxed">
                              <p className="text-gray-700 dark:text-gray-300">
                                "Money is everywhere, it affects all of us, and confuses most of us. Everyone thinks about it a little differently. It offers lessons on things that apply to many areas of life..."
                              </p>
                              <p className="text-gray-700 dark:text-gray-300">
                                "But finance is overwhelmingly taught as a math-based field, where you put data into a formula and the formula tells you what to do..."
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                              <span className="text-xs text-gray-500">Chapter 1 • Page 15 of 245</span>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">←</Button>
                                <div className="w-32 h-1 bg-gray-200 rounded-full">
                                  <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                                </div>
                                <Button variant="ghost" size="sm">→</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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

                  {/* Performance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-600">₹85,450</p>
                            <p className="text-xs text-green-500">+12% from last month</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Books Sold</p>
                            <p className="text-3xl font-bold text-purple-600">285</p>
                            <p className="text-xs text-purple-500">+8% from last month</p>
                          </div>
                          <ShoppingCart className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                            <p className="text-3xl font-bold text-blue-600">156</p>
                            <p className="text-xs text-blue-500">+15% from last month</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Reading Hours</p>
                            <p className="text-3xl font-bold text-orange-600">8,240</p>
                            <p className="text-xs text-orange-500">Total this month</p>
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

                  {/* Top Performing Books */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Physical Books</CardTitle>
                        <CardDescription>Most borrowed library books</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">The Psychology of Money</span>
                            <span className="font-bold text-blue-600">45 loans</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Atomic Habits</span>
                            <span className="font-bold text-blue-600">38 loans</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Think and Grow Rich</span>
                            <span className="font-bold text-blue-600">32 loans</span>
                          </div>
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
                          <div className="flex items-center justify-between">
                            <span className="text-sm">The Psychology of Money</span>
                            <span className="font-bold text-purple-600">₹14,850</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Atomic Habits</span>
                            <span className="font-bold text-purple-600">₹14,383</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Think and Grow Rich</span>
                            <span className="font-bold text-purple-600">₹8,553</span>
                          </div>
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
    </div>
  );
}