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
  Eye
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
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaRead Library Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage your physical library inventory and lending system</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Search Books
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
                      <Button variant="outline" className="h-16 flex-col">
                        <Book className="h-6 w-6 mb-2" />
                        <span className="text-xs">Issue Book</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col">
                        <BookOpen className="h-6 w-6 mb-2" />
                        <span className="text-xs">Return Book</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col">
                        <Users className="h-6 w-6 mb-2" />
                        <span className="text-xs">Add Member</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col">
                        <Calendar className="h-6 w-6 mb-2" />
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
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
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
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
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
                              <Button variant="outline" size="sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Follow Up
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
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
        </main>
      </div>
    </div>
  );
}