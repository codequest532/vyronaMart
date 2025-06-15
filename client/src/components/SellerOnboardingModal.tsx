import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Store, Instagram, BookOpen, ShoppingBag, Truck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SellerRegistration {
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  sellerType: string;
  businessDescription: string;
}

export default function SellerOnboardingModal({ isOpen, onClose }: SellerOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [formData, setFormData] = useState<SellerRegistration>({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    sellerType: "",
    businessDescription: ""
  });
  
  const { toast } = useToast();

  const platforms = [
    {
      id: "VyronaSpace",
      name: "VyronaSpace",
      icon: <Truck className="h-8 w-8" />,
      description: "Quick commerce & hyperlocal delivery",
      features: ["15-minute delivery", "Local store discovery", "Real-time inventory", "Geo-rewards"],
      color: "from-orange-500 to-pink-500"
    },
    {
      id: "VyronaHub",
      name: "VyronaHub", 
      icon: <Store className="h-8 w-8" />,
      description: "Traditional e-commerce marketplace",
      features: ["Product catalog", "Order management", "Customer reviews", "Analytics"],
      color: "from-blue-500 to-purple-500"
    },
    {
      id: "VyronaInstaStore",
      name: "VyronaInstaStore",
      icon: <Instagram className="h-8 w-8" />,
      description: "Instagram-based selling platform",
      features: ["Instagram integration", "Social commerce", "Direct selling", "Photo-based products"],
      color: "from-pink-500 to-red-500"
    },
    {
      id: "VyronaRead",
      name: "VyronaRead",
      icon: <BookOpen className="h-8 w-8" />,
      description: "Books, e-books & library management",
      features: ["Book rentals", "E-book sales", "Library system", "Reading analytics"],
      color: "from-green-500 to-teal-500"
    }
  ];

  const registerSellerMutation = useMutation({
    mutationFn: async (data: SellerRegistration) => {
      return apiRequest("POST", "/api/seller/register", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Registration Successful",
        description: "Your seller account has been created successfully!",
      });
      
      // Redirect to appropriate dashboard based on seller type
      const dashboardRoutes: Record<string, string> = {
        "VyronaSpace": "/vyronaspace-seller-dashboard",
        "VyronaHub": "/vyronahub-dashboard", 
        "VyronaSocial": "/vyronahub-dashboard",
        "VyronaInstaStore": "/vyronainstastore-dashboard",
        "VyronaRead": "/vyronaread-dashboard"
      };
      
      const dashboardRoute = dashboardRoutes[selectedPlatform];
      if (dashboardRoute) {
        window.location.href = dashboardRoute;
      }
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step === 1 && !selectedPlatform) {
      toast({
        title: "Please select a platform",
        variant: "destructive",
      });
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    const registrationData = {
      ...formData,
      sellerType: selectedPlatform
    };

    registerSellerMutation.mutate(registrationData);
  };

  const updateFormData = (field: keyof SellerRegistration, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Join VyronaMart as a Seller
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Platform Selection */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Selling Platform</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <Card 
                  key={platform.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlatform === platform.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${platform.color} text-white`}>
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        <CardDescription>{platform.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {platform.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Business Information */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => updateFormData("businessName", e.target.value)}
                  placeholder="Enter your business name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Business Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter your complete business address"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => updateFormData("businessDescription", e.target.value)}
                  placeholder="Describe your business and products"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Account Setup */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Account Setup</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerType">Seller Type</Label>
                  <Input
                    id="sellerType"
                    value={selectedPlatform}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={registerSellerMutation.isPending}
            >
              {registerSellerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}