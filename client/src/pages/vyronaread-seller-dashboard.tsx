import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Building2
} from "lucide-react";

export default function VyronaReadSellerDashboard() {
  const { user, isLoading } = useUserData();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaRead Dashboard...</p>
        </div>
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
                  <Button className="h-20 flex flex-col items-center justify-center bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-6 w-6 mb-2" />
                    Add New Book
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Upload className="h-6 w-6 mb-2" />
                    Upload E-Book
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Library className="h-6 w-6 mb-2" />
                    Library Settings
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

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Physical Books</h2>
                <p className="text-gray-600">Manage your book inventory</p>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Book Inventory</CardTitle>
                    <CardDescription>{books.length} books in your collection</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {books.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
                    <p className="text-gray-500 mb-4">Start building your collection by adding your first book</p>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Book
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Book</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map((book: any) => (
                          <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{book.title}</p>
                                  <p className="text-sm text-gray-500">{book.author}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{book.category}</td>
                            <td className="py-3 px-4 text-gray-900 font-medium">₹{book.price}</td>
                            <td className="py-3 px-4 text-gray-600">{book.stock}</td>
                            <td className="py-3 px-4">
                              <Badge variant={book.status === 'active' ? 'default' : 'secondary'}>
                                {book.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
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

          {/* Rentals Tab */}
          <TabsContent value="rentals" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book Rentals</h2>
                <p className="text-gray-600">Track rental status and due dates</p>
              </div>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Rental Calendar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Active Rentals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{rentals.length}</div>
                  <p className="text-sm text-gray-600">Currently rented out</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Due Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 mb-1">3</div>
                  <p className="text-sm text-gray-600">Books due for return</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 mb-1">1</div>
                  <p className="text-sm text-gray-600">Late returns</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Rental Management</CardTitle>
                <CardDescription>Track all book rentals and returns</CardDescription>
              </CardHeader>
              <CardContent>
                {rentals.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active rentals</h3>
                    <p className="text-gray-500">Rental activity will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentals.map((rental: any) => (
                      <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{rental.bookTitle}</h3>
                            <p className="text-sm text-gray-500">Rented by {rental.customerName}</p>
                            <p className="text-xs text-gray-400">Due: {new Date(rental.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={rental.status === 'overdue' ? 'destructive' : 'default'}>
                            {rental.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
    </div>
  );
}