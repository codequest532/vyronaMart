import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, BookOpen, Star } from "lucide-react";

export default function ProductionWelcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to VyronaMart
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your Complete Social Commerce Platform
          </p>
          <div className="flex justify-center space-x-4 mb-8">
            <div className="flex items-center space-x-2 text-purple-600">
              <ShoppingBag className="h-5 w-5" />
              <span className="font-medium">VyronaHub</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <Users className="h-5 w-5" />
              <span className="font-medium">VyronaSocial</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">VyronaRead</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-purple-700">VyronaHub</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Traditional e-commerce platform with individual shopping, secure payments, and seller management.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Individual product purchases</li>
                <li>• Secure payment processing</li>
                <li>• Order tracking</li>
                <li>• Seller dashboard</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-700">VyronaSocial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Social shopping rooms with group buying, real-time chat, and collaborative purchasing experiences.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Group shopping rooms</li>
                <li>• Real-time messaging</li>
                <li>• Group buying discounts</li>
                <li>• Social features</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-700">VyronaRead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Digital library platform with book rentals, e-book purchases, and library integration.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Physical book rentals</li>
                <li>• E-book purchases</li>
                <li>• Library integration</li>
                <li>• Reading management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-gray-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Platform Ready for Launch
              </h3>
              <p className="text-gray-600 mb-6">
                Your VyronaMart platform is now production-ready with a clean database and all demo data removed. 
                Start by adding your first products, creating seller accounts, or setting up your library integration.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  <strong>Next Steps:</strong>
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Configure payment gateway settings</li>
                  <li>• Add your first products and sellers</li>
                  <li>• Set up email notifications</li>
                  <li>• Configure shipping options</li>
                  <li>• Test the complete user journey</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}