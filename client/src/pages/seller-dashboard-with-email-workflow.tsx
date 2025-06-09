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
  X
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
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports & Outdoors" }
];

// Book form schema
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().min(1, "ISBN is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional(),
});

// Product form schema
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock must be non-negative"),
  weight: z.number().min(0, "Weight must be positive"),
  dimensions: z.string().optional(),
  tags: z.string().optional(),
});

// Library integration schema
const librarySchema = z.object({
  libraryName: z.string().min(1, "Library name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  libraryType: z.string().min(1, "Library type is required"),
  totalBooks: z.number().min(0, "Total books must be non-negative"),
  message: z.string().optional(),
});

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeProductTab, setActiveProductTab] = useState("vyronamart");
  const [activeBookOrderTab, setActiveBookOrderTab] = useState("sales");
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    price: "",
    description: ""
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Form hooks
  const bookForm = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      category: "",
      price: 0,
      description: "",
    }
  });

  const productForm = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      brand: "",
      sku: "",
      stock: 0,
      weight: 0,
      dimensions: "",
      tags: "",
    }
  });

  const libraryForm = useForm({
    resolver: zodResolver(librarySchema),
    defaultValues: {
      libraryName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      libraryType: "",
      totalBooks: 0,
      message: "",
    }
  });

  // Mutations
  const addBookMutation = useMutation({
    mutationFn: (bookData: any) => apiRequest("POST", "/api/books", bookData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book added successfully!",
      });
      setIsAddBookDialogOpen(false);
      bookForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add book.",
        variant: "destructive",
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (productData: any) => apiRequest("POST", "/api/products", productData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
      setIsAddProductDialogOpen(false);
      productForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product.",
        variant: "destructive",
      });
    },
  });

  const submitLibraryRequestMutation = useMutation({
    mutationFn: (libraryData: any) => apiRequest("POST", "/api/library-integration", libraryData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Library integration request submitted successfully!",
      });
      setIsLibraryDialogOpen(false);
      libraryForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to submit library integration request.",
        variant: "destructive",
      });
    },
  });

  // Order status update mutation for VyronaRead
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) => 
      apiRequest("POST", `/api/orders/${orderId}/update-status`, { status }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const handleAddLibrary = () => {
    const libraryData = {
      name: prompt("Library Name:") || "",
      type: prompt("Library Type (Public/Academic/Corporate):") || "",
      location: prompt("Location:") || "",
      contact: prompt("Contact Information:") || "",
      description: prompt("Description (optional):") || ""
    };

    if (libraryData.name && libraryData.type && libraryData.location && libraryData.contact) {
      console.log("Adding library:", libraryData);
      toast({
        title: "Success",
        description: `Library "${libraryData.name}" added successfully!`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  const handleSearchLibraries = () => {
    const searchTerm = prompt("Search libraries by name, type, or location:");
    if (searchTerm) {
      console.log(`Searching libraries for: ${searchTerm}`);
      alert(`Library Search Results for "${searchTerm}":\n\n• Central City Library - Main Branch\n• Downtown Library - Public\n• Tech University Library - Academic\n\nShowing 3 results`);
    }
  };

  const { data: sellerProducts = [] } = useQuery({
    queryKey: ["/api/seller/products"],
    refetchInterval: 30000,
  });

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.isbn || !newBook.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addBookMutation.mutate({
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn,
      genre: newBook.category,
      price: Math.floor(Math.random() * 100000) + 29900,
      category: "books",
      format: "physical"
    });
  };

  // Seller orders data with auto-refresh for new orders
  const { data: sellerOrders = [] } = useQuery({
    queryKey: ["/api/seller/orders"],
    refetchInterval: 30000,
  });

  const filteredOrders = sellerOrders.filter((order: any) => {
    if (activeBookOrderTab === "sales") return order.module === "vyronaread";
    if (activeBookOrderTab === "rentals") return order.type === "rental";
    if (activeBookOrderTab === "loans") return order.type === "loan";
    return false;
  });

  // Store data
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const statCards = [
    {
      title: "Total Revenue",
      value: "₹2,48,350",
      description: "+15% from last month",
      icon: <DollarSign className="h-6 w-6" />,
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: "342",
      description: "+8% from last month",
      icon: <ShoppingCart className="h-6 w-6" />,
      color: "text-blue-600"
    },
    {
      title: "Products Sold",
      value: "1,248",
      description: "+23% from last month",
      icon: <Package className="h-6 w-6" />,
      color: "text-purple-600"
    },
    {
      title: "Customer Rating",
      value: "4.8",
      description: "Based on 126 reviews",
      icon: <Star className="h-6 w-6" />,
      color: "text-yellow-600"
    }
  ];

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "vyronamart", label: "VyronaMart Products", icon: Store },
    { id: "vyronaread", label: "VyronaRead Books", icon: BookOpen },
    { id: "orders", label: "Orders & Analytics", icon: ShoppingCart },
    { id: "customers", label: "Customer Management", icon: Users },
    { id: "settings", label: "Store Settings", icon: Settings }
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setLocation('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const onBookSubmit = (data: any) => {
    addBookMutation.mutate({
      ...data,
      category: "books",
      format: "physical"
    });
  };

  const onProductSubmit = (data: any) => {
    addProductMutation.mutate(data);
  };

  const onLibrarySubmit = (data: any) => {
    submitLibraryRequestMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Seller Hub</h1>
          </div>
        </div>
        
        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                activeTab === item.id 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600" 
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
                    <CardDescription>Manage your store efficiently</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full justify-start gap-2" 
                      variant="outline"
                      onClick={() => setActiveTab("vyronamart")}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Product
                    </Button>
                    <Button 
                      className="w-full justify-start gap-2" 
                      variant="outline"
                      onClick={() => setActiveTab("vyronaread")}
                    >
                      <BookOpen className="h-4 w-4" />
                      Add New Book
                    </Button>
                    <Button 
                      className="w-full justify-start gap-2" 
                      variant="outline"
                      onClick={() => setActiveTab("orders")}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      View Orders
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your store</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">New order received - ₹2,450</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Product "Wireless Headphones" updated</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Low stock alert: "Gaming Mouse"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "vyronaread" && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaRead Books</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage your book inventory and library integrations</p>
                </div>
                <div className="flex gap-3">
                  <Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Library className="h-4 w-4" />
                        Library Integration
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Library Integration Request</DialogTitle>
                        <DialogDescription>
                          Submit a request to integrate with libraries for book lending and distribution
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...libraryForm}>
                        <form onSubmit={libraryForm.handleSubmit(onLibrarySubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={libraryForm.control}
                              name="libraryName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Library Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter library name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={libraryForm.control}
                              name="libraryType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Library Type *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="public">Public Library</SelectItem>
                                      <SelectItem value="academic">Academic Library</SelectItem>
                                      <SelectItem value="corporate">Corporate Library</SelectItem>
                                      <SelectItem value="special">Special Library</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={libraryForm.control}
                              name="contactPerson"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Person *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Contact person name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={libraryForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="contact@library.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={libraryForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+91 9876543210" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={libraryForm.control}
                              name="totalBooks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Books in Collection</FormLabel>
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

                          <FormField
                            control={libraryForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Complete address with city, state, and pincode"
                                    className="resize-none"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={libraryForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Message</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Any additional information or special requirements"
                                    className="resize-none"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsLibraryDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={submitLibraryRequestMutation.isPending}>
                              {submitLibraryRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAddBookDialogOpen} onOpenChange={setIsAddBookDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Book</DialogTitle>
                        <DialogDescription>
                          Add a new book to your VyronaRead inventory
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...bookForm}>
                        <form onSubmit={bookForm.handleSubmit(onBookSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={bookForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Book Title *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter book title" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={bookForm.control}
                              name="author"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Author *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Author name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={bookForm.control}
                              name="isbn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ISBN *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="978-3-16-148410-0" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={bookForm.control}
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
                                      <SelectItem value="fiction">Fiction</SelectItem>
                                      <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                                      <SelectItem value="academic">Academic</SelectItem>
                                      <SelectItem value="children">Children's Books</SelectItem>
                                      <SelectItem value="biography">Biography</SelectItem>
                                      <SelectItem value="history">History</SelectItem>
                                      <SelectItem value="science">Science</SelectItem>
                                      <SelectItem value="technology">Technology</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={bookForm.control}
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
                            control={bookForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Book description, summary, or additional details"
                                    className="resize-none"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsAddBookDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addBookMutation.isPending}>
                              {addBookMutation.isPending ? "Adding..." : "Add Book"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Book Management Tabs */}
              <Tabs value={activeBookOrderTab} onValueChange={setActiveBookOrderTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="sales">Book Sales</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="rentals">Rentals</TabsTrigger>
                  <TabsTrigger value="loans">Library Loans</TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>VyronaRead Book Sales</CardTitle>
                      <CardDescription>Manage book sales and order status updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredOrders.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No book sales orders yet</p>
                          </div>
                        ) : (
                          filteredOrders.map((order: any) => (
                            <div key={order.order_id || order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    Order #{order.order_id || order.id}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Customer: {order.customer_name || order.metadata?.customerName || "Unknown"}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Total: ₹{order.total_amount || 0}
                                  </p>
                                </div>
                                <Badge variant={
                                  order.order_status === 'delivered' || order.status === 'delivered' ? 'default' :
                                  order.order_status === 'shipped' || order.status === 'shipped' ? 'secondary' :
                                  order.order_status === 'processing' || order.status === 'processing' ? 'outline' : 'destructive'
                                }>
                                  {order.order_status || order.status || 'pending'}
                                </Badge>
                              </div>
                              
                              {order.metadata?.items && (
                                <div className="border-t pt-3">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items:</p>
                                  {order.metadata.items.map((item: any, index: number) => (
                                    <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                      • {item.name} - Qty: {item.quantity} - ₹{item.price}
                                    </p>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex gap-2 items-center">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                                
                                {/* Status Update Dropdown for VyronaRead Orders */}
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={order.order_status || order.status || 'pending'}
                                    onValueChange={(status) => updateOrderStatusMutation.mutate({ 
                                      orderId: order.order_id || order.id, 
                                      status 
                                    })}
                                    disabled={updateOrderStatusMutation.isPending}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {updateOrderStatusMutation.isPending && (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                  )}
                                </div>
                                
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
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Book Inventory</CardTitle>
                      <CardDescription>Manage your book stock and availability</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sellerProducts.filter((product: any) => product.category === 'books').length === 0 ? (
                          <div className="text-center py-8">
                            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No books in inventory</p>
                            <Button 
                              className="mt-4" 
                              onClick={() => setIsAddBookDialogOpen(true)}
                            >
                              Add Your First Book
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sellerProducts
                              .filter((product: any) => product.category === 'books')
                              .map((book: any) => (
                                <Card key={book.id}>
                                  <CardContent className="p-4">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-gray-900 dark:text-white">{book.name}</h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{book.description}</p>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-green-600">₹{book.price}</span>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline">
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rentals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Book Rentals</CardTitle>
                      <CardDescription>Manage rental agreements and returns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No active rentals</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="loans" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Library Loans</CardTitle>
                      <CardDescription>Track books loaned to library partners</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No library loans</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Other tabs content would continue here... */}
          
        </main>
      </div>
    </div>
  );
}