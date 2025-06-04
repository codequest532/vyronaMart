import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Book,
  Star,
  Heart,
  BookOpen,
  Download,
  Eye,
  Clock,
  Users,
  Trophy,
  Bookmark,
  Search,
  Filter,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Settings,
  Moon,
  Sun,
  Type,
  Layers,
  FileText,
  Library,
  Building,
  Edit
} from "lucide-react";

export default function VyronaRead() {
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [readingMode, setReadingMode] = useState("light");
  const [fontSize, setFontSize] = useState("medium");

  // VyronaRead data queries - real-time data from seller dashboard and admin
  const { data: sellerEBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
  });

  const { data: sellerBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
  });

  const { data: libraryBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
  });

  const { data: availableLibraries = [] } = useQuery({
    queryKey: ["/api/vyronaread/libraries"],
  });

  const { data: libraryRequests = [] } = useQuery({
    queryKey: ["/api/admin/library-requests"],
  });

  // Get all products from seller dashboard for Browse Books section
  const { data: allProducts = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Filter books from products (books have category like 'books', 'education', etc.)
  const allBooks = allProducts.filter((product: any) => 
    product.category && ['books', 'education', 'romance', 'sci-fi', 'mystery', 'fantasy', 'biography'].includes(product.category.toLowerCase())
  );

  // Apply category filter
  const filteredBooks = selectedCategory === "all" 
    ? allBooks 
    : allBooks.filter((book: any) => book.category?.toLowerCase() === selectedCategory);

  // Combine all book sources for Browse Books section
  const combinedBooks = [
    ...filteredBooks,
    ...sellerEBooks,
    ...sellerBooks,
    ...libraryBooks
  ].filter((book, index, self) => 
    index === self.findIndex((b) => b.id === book.id)
  );

  // Get user's orders for Currently Reading
  const { data: userOrders = [] } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Get currently reading books from user's completed orders
  const currentlyReadingBooks = userOrders
    .filter((order: any) => order.status === 'completed' && order.module === 'vyronaread')
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <Card className="vyrona-gradient-read text-white mb-6">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-2">VyronaRead</h1>
          <p className="text-lg opacity-90">Read. Return. Repeat. - Your smart reading ecosystem</p>
        </CardContent>
      </Card>

      {/* Reading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Books Read</p>
                <p className="text-2xl font-bold text-purple-600">24</p>
              </div>
              <Book className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reading Hours</p>
                <p className="text-2xl font-bold text-blue-600">156h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bookmarks</p>
                <p className="text-2xl font-bold text-green-600">89</p>
              </div>
              <Bookmark className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievement</p>
                <p className="text-2xl font-bold text-amber-600">Level 8</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 1. Browse Books */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Browse Books</h3>
            <div className="flex items-center space-x-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  <SelectItem value="mystery">Mystery</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="biography">Biography</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combinedBooks.length > 0 ? combinedBooks.map((book, index) => (
              <Card key={index} className="border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">📚</div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{book.name || book.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">by {book.author || "Unknown Author"}</p>
                    <Badge variant="secondary" className="text-xs">{book.category}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="text-amber-400 h-3 w-3 fill-current" />
                        <span className="font-medium">4.2</span>
                      </div>
                      <span className="font-bold text-purple-600">₹{(book.price / 100).toFixed(0)}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <BookOpen className="mr-1 h-3 w-3" />
                        Read
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No books available in this category.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Library Integration */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📚 Library Integration</h3>
            <Button className="bg-green-600 hover:bg-green-700">
              <Building className="mr-2 h-4 w-4" />
              Connect Library
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableLibraries.length > 0 ? availableLibraries.map((library, index) => (
              <Card key={index} className="border border-gray-200 hover:border-green-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Library className="text-green-600 h-5 w-5" />
                      <h4 className="font-semibold text-sm">{library.name}</h4>
                    </div>
                    <Badge 
                      variant={library.status === "Connected" ? "default" : "secondary"}
                      className={library.status === "Connected" ? "bg-green-100 text-green-700" : ""}
                    >
                      {library.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Books Available:</span>
                      <span className="font-medium">{library.books.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{library.distance}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {library.status === "Connected" ? (
                      <Button size="sm" className="w-full" variant="outline">
                        <BookOpen className="mr-1 h-3 w-3" />
                        Browse Catalog
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        Connect Library
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. VyronaRead E-Reader */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">VyronaRead E-Reader</h3>
            <Badge variant="outline" className="text-blue-700">Kindle-like Experience</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Reading Features</h4>
              <div className="space-y-3">
                {[
                  { feature: "Customizable Font Size", icon: Type },
                  { feature: "Night Mode Reading", icon: Moon },
                  { feature: "Bookmark Management", icon: Bookmark },
                  { feature: "Progress Tracking", icon: FileText },
                  { feature: "Highlight & Notes", icon: Edit },
                  { feature: "Offline Reading", icon: Download }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <item.icon className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">{item.feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Reader Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reading Mode</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={readingMode === "light" ? "default" : "outline"}
                      onClick={() => setReadingMode("light")}
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={readingMode === "dark" ? "default" : "outline"}
                      onClick={() => setReadingMode("dark")}
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Font Size</span>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Currently Reading */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Currently Reading</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentlyReadingBooks.length > 0 ? currentlyReadingBooks.map((order, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{book.cover}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{book.title}</h4>
                      <p className="text-sm text-gray-500 mb-2">by {book.author}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <Progress value={book.progress} className="h-2" />
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Time left: {book.timeLeft}</span>
                          <span>Last read: {book.lastRead}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <Play className="mr-1 h-3 w-3" />
                          Continue
                        </Button>
                        <Button size="sm" variant="outline">
                          <Bookmark className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}