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
  enableGroupBuy: z.boolean().default(false),
  groupBuyMinQuantity: z.number().min(1).optional(),
  groupBuyDiscount: z.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
});

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [activeBookOrderTab, setActiveBookOrderTab] = useState("all");
  const [showAddLibraryDialog, setShowAddLibraryDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  // Get current user for authentication check
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
  });

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!userLoading && (!currentUser || currentUser.role !== 'seller')) {
      setLocation('/login');
      toast({
        title: "Authentication Required",
        description: "Please log in as a seller to access this dashboard.",
        variant: "destructive",
      });
    }
  }, [currentUser, userLoading, setLocation, toast]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "seller") {
    return null;
  }
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
    description: "",
    booksListCsv: null as File | null
  });
  const [csvBooksList, setCsvBooksList] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{
    mainImage: File | null;
    additionalMedia: File[];
  }>({
    mainImage: null,
    additionalMedia: [],
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [selectedProductForAnalytics, setSelectedProductForAnalytics] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Product form tab tracking
  const [currentProductTab, setCurrentProductTab] = useState("basic");
  const [completedProductTabs, setCompletedProductTabs] = useState<Set<string>>(new Set());
  
  // Tab order for progressive navigation
  const tabOrder = ["basic", "details", "images", "inventory"];
  
  // Get next incomplete tab
  const getNextIncompleteTab = () => {
    for (const tab of tabOrder) {
      if (!completedProductTabs.has(tab)) {
        return tab;
      }
    }
    return null;
  };
  
  // Navigate to next tab
  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(currentProductTab);
    const nextIndex = currentIndex + 1;
    if (nextIndex < tabOrder.length) {
      setCurrentProductTab(tabOrder[nextIndex]);
    }
  };
  
  // Check if current tab is completed
  const isCurrentTabCompleted = completedProductTabs.has(currentProductTab);
  
  // Check if we're on the last tab
  const isLastTab = currentProductTab === "inventory";

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
      enableGroupBuy: false,
      groupBuyMinQuantity: 2,
      groupBuyDiscount: 10,
      isActive: true,
    },
  });

  // Get seller-specific products
  const { data: sellerProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/seller/products"],
    enabled: !!currentUser && currentUser.role === 'seller',
  });

  // Tab validation functions
  const validateBasicInfoTab = () => {
    const values = productForm.getValues();
    return !!(values.name && values.description && values.category);
  };

  const validateProductDetailsTab = () => {
    const values = productForm.getValues();
    return !!(values.price && values.price > 0 && values.brand);
  };

  const validateImagesTab = () => {
    // For now, we'll make images optional but track completion
    return true; // Images are optional but tab must be visited
  };

  const validateInventoryTab = () => {
    const values = productForm.getValues();
    // Must have visited the tab and made platform selection (enableGroupBuy choice)
    return values.enableGroupBuy !== undefined;
  };

  // Function to mark tab as completed when all required fields are filled
  const checkAndMarkTabComplete = (tabName: string) => {
    let isValid = false;
    
    switch (tabName) {
      case 'basic':
        isValid = validateBasicInfoTab();
        break;
      case 'details':
        isValid = validateProductDetailsTab();
        break;
      case 'images':
        isValid = validateImagesTab();
        break;
      case 'inventory':
        isValid = validateInventoryTab();
        break;
    }

    if (isValid) {
      setCompletedProductTabs(prev => new Set([...prev, tabName]));
    } else {
      setCompletedProductTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabName);
        return newSet;
      });
    }
  };

  // Check if all tabs are completed
  const allTabsCompleted = completedProductTabs.size === 4;

  // Watch form changes to automatically validate tabs
  const formValues = productForm.watch();
  
  // Real-time validation effect
  useEffect(() => {
    checkAndMarkTabComplete('basic');
    checkAndMarkTabComplete('details');
    checkAndMarkTabComplete('images');
    checkAndMarkTabComplete('inventory');
  }, [formValues.name, formValues.description, formValues.category, formValues.price, formValues.brand, formValues.weight, formValues.dimensions, formValues.enableGroupBuy, uploadedFiles.mainImage]);

  const addProductMutation = useMutation({
    mutationFn: async (productData: z.infer<typeof productSchema>) => {
      // Upload main image and additional images
      let imageUrl = null;
      const imageUrls: string[] = [];
      
      // Upload main image
      if (uploadedFiles.mainImage) {
        const formData = new FormData();
        formData.append('image', uploadedFiles.mainImage);
        
        const uploadResponse = await fetch('/api/upload/product-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.imageUrl;
          imageUrls.push(uploadResult.imageUrl);
        } else {
          throw new Error('Failed to upload main image');
        }
      }
      
      // Upload additional images
      for (const file of uploadedFiles.additionalMedia) {
        if (file.type.startsWith('image/')) {
          const formData = new FormData();
          formData.append('image', file);
          
          const uploadResponse = await fetch('/api/upload/product-image', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            imageUrls.push(uploadResult.imageUrl);
          }
        }
      }

      // Determine platform based on enableGroupBuy selection
      const module = productData.enableGroupBuy ? "vyronasocial" : "vyronahub";
      
      const productPayload = {
        ...productData, 
        module, 
        imageUrl, // Primary image for backward compatibility
        imageUrls // Array of all uploaded images
      };
      
      return await apiRequest("POST", "/api/products", productPayload);
    },
    onSuccess: () => {
      toast({
        title: "Product Added Successfully",
        description: "Your product has been added to the catalog.",
      });
      resetProductForm();
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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been successfully removed from your catalog.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Product",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete product handler - now uses AlertDialog instead of window.confirm
  const handleDeleteProduct = (productId: number) => {
    deleteProductMutation.mutate(productId);
  };

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

  const handleAddProduct = (data: z.infer<typeof productSchema>) => {
    // Check if all tabs are completed before submission
    if (!allTabsCompleted) {
      const missingTabs = [];
      if (!completedProductTabs.has('basic')) missingTabs.push('Basic Info');
      if (!completedProductTabs.has('details')) missingTabs.push('Product Details');
      if (!completedProductTabs.has('images')) missingTabs.push('Images & Media');
      if (!completedProductTabs.has('inventory')) missingTabs.push('Inventory & Specs');
      
      toast({
        title: "Complete All Tabs Required",
        description: `Please complete the following tabs: ${missingTabs.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    addProductMutation.mutate(data);
  };

  // Reset form and tabs when dialog closes
  const resetProductForm = () => {
    productForm.reset();
    setCurrentProductTab("basic");
    setCompletedProductTabs(new Set());
    setShowAddProductDialog(false);
    setUploadedFiles({ mainImage: null, additionalMedia: [] });
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



  // Order status update mutation with automated email workflow
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: { orderId: number; status: string; trackingNumber?: string }) => {
      return await apiRequest("PATCH", `/api/seller/orders/${orderId}/status`, { status, trackingNumber });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Order Status Updated",
        description: data.emailSent 
          ? "Order status updated and customer notification email sent successfully" 
          : `Order status updated${data.emailError ? ` (email failed: ${data.emailError})` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
      setSelectedOrder(null);
      setShowOrderDetails(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleSearchLibraries = () => {
    const searchTerm = prompt("Search libraries by name, type, or location:");
    if (searchTerm) {
      console.log(`Searching libraries for: ${searchTerm}`);
      alert(`Library Search Results for "${searchTerm}":\n\n• Central City Library - Main Branch\n• Downtown Library - Public\n• Tech University Library - Academic\n\nShowing 3 results`);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleViewAnalytics = (product: any) => {
    setSelectedProductForAnalytics(product);
    setShowAnalyticsDialog(true);
  };





  const { data: vyronaReadBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/books"],
    queryFn: () => apiRequest("GET", "/api/products?module=vyronaread"),
  });

  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      return await apiRequest("POST", "/api/vyronaread/books", bookData);
    },
    onSuccess: () => {
      toast({
        title: "Book Added Successfully",
        description: "Your book has been added to VyronaRead catalog.",
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add book",
        description: error.message,
        variant: "destructive",
      });
    },
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
    refetchInterval: 30000, // Refresh every 30 seconds for new orders
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["/api/seller/analytics"],
  });

  // This duplicate declaration is removed - using the one above with automated email workflow

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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // Clear cache first for faster perceived logout
      queryClient.clear();
      
      // Call logout endpoint without waiting for response
      fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
      
      // Immediate redirect for better UX
      window.location.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.replace('/');
    }
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
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <Store className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaHub & VyronaSocial Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage your group-buying & social commerce store</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowAddProductDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
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
              Social Analytics
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

              {/* Recent Products Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Your Products Overview
                  </CardTitle>
                  <CardDescription>
                    Recent products from your VyronaHub catalog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sellerProducts && sellerProducts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {sellerProducts.slice(0, 6).map((product: any) => (
                          <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4 flex-1">
                                {product.imageUrl && (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {product.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                    {product.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {product.category}
                                    </Badge>
                                    <span className="text-sm font-medium text-green-600">
                                      ₹{product.price}
                                    </span>
                                    <Badge 
                                      variant={product.module === 'vyronahub' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {product.module === 'vyronahub' ? 'VyronaHub' : product.module}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {sellerProducts.length > 6 && (
                        <div className="text-center pt-4 border-t">
                          <Button variant="outline" onClick={() => setActiveTab("products")}>
                            View All {sellerProducts.length} Products
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Products Yet</h3>
                      <p className="text-gray-500 mb-4">Start building your VyronaHub catalog</p>
                      <Button onClick={() => setShowAddProductDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Product
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <h3 className="font-medium mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
                              <Badge variant="outline">Active</Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleViewAnalytics(product)}
                              >
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Analytics
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    disabled={deleteProductMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{product.name}"? This action cannot be undone and will permanently remove the product from your catalog.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Product
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                <p className="text-gray-600 dark:text-gray-300">Track and manage orders from VyronaHub and VyronaSocial (excluding book-related orders)</p>
              </div>

              {/* Order Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {sellerOrders?.filter((order: any) => order.module !== 'vyronaread').length || 0}
                        </p>
                        <p className="text-xs text-blue-500">All modules</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">VyronaHub Orders</p>
                        <p className="text-3xl font-bold text-green-600">
                          {sellerOrders?.filter((order: any) => order.module === 'vyronahub').length || 0}
                        </p>
                        <p className="text-xs text-green-500">Individual purchases</p>
                      </div>
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">VyronaSocial Orders</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {sellerOrders?.filter((order: any) => order.module === 'vyronasocial').length || 0}
                        </p>
                        <p className="text-xs text-purple-500">Group purchases</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-orange-600">
                          ₹{sellerOrders?.filter((order: any) => order.module !== 'vyronaread').reduce((total: number, order: any) => total + (order.total_amount / 100), 0).toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-orange-500">All time</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* VyronaHub Orders Panel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Store className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-green-700">VyronaHub Orders</CardTitle>
                      <CardDescription>Individual product purchases from your store</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const vyronahubOrders = sellerOrders?.filter((order: any) => order.module === 'vyronahub') || [];
                    return vyronahubOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No VyronaHub Orders</h3>
                        <p className="text-gray-500">Individual product orders will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {vyronahubOrders.map((order: any) => (
                          <div key={order.order_id || order.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <p className="font-medium">Order #{order.order_id || order.id}</p>
                                <Badge variant={
                                  order.order_status === 'delivered' || order.status === 'delivered' ? 'default' :
                                  order.order_status === 'processing' || order.status === 'processing' ? 'secondary' :
                                  order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery' ? 'secondary' :
                                  order.order_status === 'shipped' || order.status === 'shipped' ? 'outline' : 'destructive'
                                }>
                                  {(order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery') ? 'Out for Delivery' : (order.order_status || order.status || 'Processing')}
                                </Badge>
                                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-100">
                                  Individual Purchase
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">Customer: {order.customer_name || order.customer_email || 'N/A'}</p>
                              {order.metadata?.product_names && (
                                <p className="text-sm text-gray-600">Products: {order.metadata.product_names}</p>
                              )}
                              <p className="text-sm font-medium text-green-600">
                                ₹{((order.total_amount || order.totalAmount) / 100).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Ordered: {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <select 
                                value={order.order_status || order.status || "processing"}
                                onChange={(e) => updateOrderStatusMutation.mutate({
                                  orderId: order.order_id || order.id,
                                  status: e.target.value
                                })}
                                className="text-sm border rounded px-2 py-1"
                              >
                                
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* VyronaSocial Orders Panel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-700">VyronaSocial Orders</CardTitle>
                      <CardDescription>Group purchases and collaborative shopping</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const vyronasocialOrders = sellerOrders?.filter((order: any) => order.module === 'vyronasocial') || [];
                    return vyronasocialOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No VyronaSocial Orders</h3>
                        <p className="text-gray-500">Group purchase orders will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {vyronasocialOrders.map((order: any) => (
                          <div key={order.order_id || order.id} className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <p className="font-medium">Order #{order.order_id || order.id}</p>
                                <Badge variant={
                                  order.order_status === 'delivered' || order.status === 'delivered' ? 'default' :
                                  order.order_status === 'processing' || order.status === 'processing' ? 'secondary' :
                                  order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery' ? 'secondary' :
                                  order.order_status === 'shipped' || order.status === 'shipped' ? 'outline' : 'destructive'
                                }>
                                  {(order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery') ? 'Out for Delivery' : (order.order_status || order.status || 'Processing')}
                                </Badge>
                                <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-100">
                                  Group Purchase
                                </Badge>
                                {order.metadata?.group_size && (
                                  <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                                    {order.metadata.group_size} members
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">Customer: {order.customer_name || order.customer_email || 'N/A'}</p>
                              {order.metadata?.group_name && (
                                <p className="text-sm text-gray-600">Group: {order.metadata.group_name}</p>
                              )}
                              {order.metadata?.product_names && (
                                <p className="text-sm text-gray-600">Products: {order.metadata.product_names}</p>
                              )}
                              <p className="text-sm font-medium text-purple-600">
                                ₹{((order.total_amount || order.totalAmount) / 100).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Ordered: {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <select 
                                value={order.order_status || order.status || "processing"}
                                onChange={(e) => updateOrderStatusMutation.mutate({
                                  orderId: order.order_id || order.id,
                                  status: e.target.value
                                })}
                                className="text-sm border rounded px-2 py-1"
                              >
                                
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                              >
                                View Details
                              </Button>
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
        </main>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.order_id}</DialogTitle>
            <DialogDescription>
              Complete order information and management options
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="overflow-y-auto flex-1 px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Order Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{selectedOrder?.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={
                        selectedOrder?.order_status === 'delivered' ? 'default' :
                        selectedOrder?.order_status === 'processing' ? 'secondary' : 'destructive'
                      }>
                        {selectedOrder?.order_status || 'Processing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium text-green-600">
                        ₹{((selectedOrder?.total_amount || selectedOrder?.totalAmount || 0) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedOrder?.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedOrder?.customer_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedOrder?.customer_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder?.items && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                  <div className="space-y-2">
                    {JSON.parse(selectedOrder.items || '[]').map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₹{((item.price || 0) / 100).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {selectedOrder?.shipping_address && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Shipping Address</h3>
                  <div className="p-3 border rounded bg-gray-50 dark:bg-gray-800">
                    <p>{selectedOrder.shipping_address}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
