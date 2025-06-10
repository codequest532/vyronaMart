import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DemoSellerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "seller@vyronahub.com",
    password: "demo123"
  });
  const [isLogging, setIsLogging] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      // First create demo data
      await fetch("/api/create-demo-seller-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      // Then login
      const response = await fetch("/api/demo-seller-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome to VyronaHub Seller Dashboard",
        });
        setLocation("/seller-dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Demo Seller Login</CardTitle>
          <CardDescription>
            Access VyronaHub & VyronaSocial Seller Dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
                  readOnly
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLogging}
            >
              {isLogging ? "Logging in..." : "Login to Seller Dashboard"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Demo Account Details</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Email:</strong> seller@vyronahub.com</p>
              <p><strong>Password:</strong> demo123</p>
              <p><strong>Role:</strong> VyronaHub & VyronaSocial Seller</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="text-sm"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}