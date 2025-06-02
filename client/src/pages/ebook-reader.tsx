import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Settings, 
  BookOpen, 
  Search, 
  Bookmark,
  Sun,
  Moon,
  Type,
  ChevronLeft,
  ChevronRight,
  Home,
  Download,
  Heart,
  Star,
  Play,
  Pause
} from "lucide-react";

export default function EbookReader() {
  const [, setLocation] = useLocation();
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);

  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const digitalBooks = Array.isArray(books) ? books.filter((book: any) => book.type === 'digital') : [];

  // Check for book passed via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookParam = urlParams.get('book');
    if (bookParam) {
      try {
        const bookData = JSON.parse(decodeURIComponent(bookParam));
        setSelectedBook(bookData);
        setIsReading(true);
        setCurrentPage(1);
        setReadingProgress(0);
      } catch (error) {
        console.error('Error parsing book data from URL:', error);
      }
    }
  }, []);

  const sampleContent = `
    Chapter 1: Introduction to Modern Web Development
    
    In the rapidly evolving world of technology, web development has become one of the most crucial skills for creating digital experiences that connect people across the globe. This comprehensive guide will take you through the journey of understanding modern web development principles, from the foundational concepts to advanced implementation techniques.
    
    The landscape of web development has transformed dramatically over the past decade. What once required separate desktop applications can now be achieved through sophisticated web applications that run seamlessly across different devices and platforms. This transformation has been driven by advancements in web technologies, improved browser capabilities, and the growing demand for interactive, responsive user experiences.
    
    Understanding the Core Technologies
    
    At the heart of web development lie three fundamental technologies: HTML (HyperText Markup Language), CSS (Cascading Style Sheets), and JavaScript. These technologies work together to create the structure, styling, and functionality of web applications.
    
    HTML serves as the backbone of any web page, providing the semantic structure that browsers can interpret and display. It defines the content hierarchy, from headings and paragraphs to complex interactive elements. Modern HTML5 introduces semantic elements that not only improve accessibility but also enhance search engine optimization.
    
    CSS brings visual appeal to web pages, controlling everything from colors and fonts to layout and animations. The evolution of CSS has introduced powerful features like Flexbox and Grid, which have revolutionized how developers approach responsive design. These tools enable the creation of layouts that adapt seamlessly to different screen sizes and orientations.
    
    JavaScript adds interactivity and dynamic behavior to web applications. From simple form validation to complex single-page applications, JavaScript has evolved into a versatile programming language that can handle both client-side and server-side development.
  `;

  const handleBookSelect = (book: any) => {
    setSelectedBook(book);
    setIsReading(true);
    setCurrentPage(1);
    setReadingProgress(0);
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < 100) {
      setCurrentPage(prev => prev + 1);
      setReadingProgress((currentPage / 100) * 100);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      setReadingProgress((currentPage / 100) * 100);
    }
  };

  const toggleBookmark = () => {
    if (bookmarks.includes(currentPage)) {
      setBookmarks(prev => prev.filter(page => page !== currentPage));
    } else {
      setBookmarks(prev => [...prev, currentPage]);
    }
  };

  if (isReading && selectedBook) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        {/* Reading Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsReading(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
              <div>
                <h1 className="font-semibold text-lg">{selectedBook.title}</h1>
                <p className="text-sm text-gray-500">{selectedBook.author}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
                className={bookmarks.includes(currentPage) ? 'text-yellow-500' : ''}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm">Page {currentPage} of 100</span>
              <div className="flex-1">
                <Slider
                  value={[readingProgress]}
                  onValueChange={(value) => {
                    setReadingProgress(value[0]);
                    setCurrentPage(Math.round((value[0] / 100) * 100) || 1);
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm">{Math.round(readingProgress)}%</span>
            </div>
          </div>
        </div>

        {/* Reading Content */}
        <div className="flex-1 p-8 max-w-4xl mx-auto">
          <div 
            className="prose prose-lg max-w-none"
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: '1.8',
              fontFamily: 'Georgia, serif'
            }}
          >
            <div className="whitespace-pre-line">
              {sampleContent}
            </div>
          </div>
        </div>

        {/* Reading Controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={24}
                  step={1}
                  className="w-20"
                />
                <span className="text-sm">{fontSize}px</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange('next')}
              disabled={currentPage === 100}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaRead E-Reader</h1>
                <p className="text-gray-600 dark:text-gray-300">Your digital library and reading experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search Books
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Total Books</h3>
              <p className="text-2xl font-bold text-blue-600">{digitalBooks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Bookmark className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
              <p className="text-2xl font-bold text-yellow-600">{bookmarks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Reading Level</h3>
              <p className="text-2xl font-bold text-purple-600">Advanced</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Favorites</h3>
              <p className="text-2xl font-bold text-red-600">3</p>
            </CardContent>
          </Card>
        </div>

        {/* Digital Books Library */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Library</h2>
            <Badge variant="secondary" className="text-purple-600 bg-purple-50">
              {digitalBooks.length} E-Books Available
            </Badge>
          </div>

          {digitalBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {digitalBooks.map((book: any) => (
                <Card key={book.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      <BookOpen className="h-16 w-16 text-purple-600" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <Button 
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={() => handleBookSelect(book)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Read Now
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {book.genre || 'Fiction'}
                        </Badge>
                        <span className="text-sm font-medium text-purple-600">${book.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleBookSelect(book)}
                        >
                          Read Now
                        </Button>
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No E-Books Available</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  E-books will appear here once sellers upload digital books or libraries are integrated
                </p>
                <Button onClick={() => setLocation('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse More Books
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reader Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Sun className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reading Modes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Switch between light and dark modes for comfortable reading
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Type className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customizable Text</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Adjust font size, style, and spacing for your reading preference
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Bookmark className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Bookmarks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Save your reading progress and favorite passages automatically
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}