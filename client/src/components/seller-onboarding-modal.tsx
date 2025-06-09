import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Instagram, Store, Users, Building, ShoppingBag } from "lucide-react";

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SellerType = "vyronainstastore" | "vyronahub" | "vyronaspace" | "vyronamallconnect" | null;

interface FormData {
  sellerType: SellerType;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessCategory: string;
  businessDescription: string;
  instagramHandle?: string;
  websiteUrl?: string;
  storeAddress?: string;
  mallName?: string;
  brandName?: string;
  gstNumber?: string;
  panNumber?: string;
  expectedMonthlyRevenue: string;
  hasExistingOnlinePresence: string;
}

const sellerTypes = [
  {
    id: "vyronainstastore" as const,
    title: "VyronaInstaStore",
    description: "For Instagram-based sellers",
    icon: Instagram,
    color: "bg-gradient-to-br from-pink-500 to-purple-600",
    features: ["Instagram Integration", "Social Commerce", "Direct Messaging", "Story Integration"]
  },
  {
    id: "vyronahub" as const,
    title: "VyronaHub & VyronaSocial",
    description: "For general e-commerce sellers with group-buying",
    icon: Users,
    color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    features: ["Group Buying", "Social Shopping", "Community Features", "Bulk Orders"]
  },
  {
    id: "vyronaspace" as const,
    title: "VyronaSpace",
    description: "For retail/local physical stores",
    icon: Store,
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
    features: ["Local Discovery", "In-Store Pickup", "Location-Based", "Hybrid Shopping"]
  },
  {
    id: "vyronamallconnect" as const,
    title: "VyronaMallConnect",
    description: "For mall-based or premium brand stores",
    icon: Building,
    color: "bg-gradient-to-br from-orange-500 to-red-600",
    features: ["Premium Branding", "Mall Integration", "Brand Management", "Enterprise Features"]
  }
];

export default function SellerOnboardingModal({ isOpen, onClose }: SellerOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    sellerType: null,
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessCategory: "",
    businessDescription: "",
    expectedMonthlyRevenue: "",
    hasExistingOnlinePresence: ""
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/seller-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onClose();
        // Show success message or redirect
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Choose Your Seller Type</h3>
              <p className="text-gray-600">Select the platform that best fits your business model</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellerTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.sellerType === type.id;
                
                return (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                    onClick={() => updateFormData({ sellerType: type.id })}
                  >
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {type.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Business Information</h3>
              <p className="text-gray-600">Tell us about your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => updateFormData({ businessName: e.target.value })}
                  placeholder="Enter your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => updateFormData({ ownerName: e.target.value })}
                  placeholder="Enter owner name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCategory">Business Category *</Label>
                <Select onValueChange={(value) => updateFormData({ businessCategory: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="home">Home & Living</SelectItem>
                    <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                    <SelectItem value="sports">Sports & Fitness</SelectItem>
                    <SelectItem value="books">Books & Media</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedRevenue">Expected Monthly Revenue</Label>
                <Select onValueChange={(value) => updateFormData({ expectedMonthlyRevenue: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-50k">₹0 - ₹50,000</SelectItem>
                    <SelectItem value="50k-2l">₹50,000 - ₹2,00,000</SelectItem>
                    <SelectItem value="2l-5l">₹2,00,000 - ₹5,00,000</SelectItem>
                    <SelectItem value="5l+">₹5,00,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => updateFormData({ businessDescription: e.target.value })}
                placeholder="Describe your business and products"
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Platform-Specific Details</h3>
              <p className="text-gray-600">Additional information for your chosen platform</p>
            </div>

            {formData.sellerType === "vyronainstastore" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagramHandle">Instagram Handle *</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="instagramHandle"
                      value={formData.instagramHandle || ""}
                      onChange={(e) => updateFormData({ instagramHandle: e.target.value })}
                      placeholder="@yourusername"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {(formData.sellerType === "vyronahub" || formData.sellerType === "vyronainstastore") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                  <Input
                    id="websiteUrl"
                    value={formData.websiteUrl || ""}
                    onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            )}

            {formData.sellerType === "vyronaspace" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address *</Label>
                  <Textarea
                    id="storeAddress"
                    value={formData.storeAddress || ""}
                    onChange={(e) => updateFormData({ storeAddress: e.target.value })}
                    placeholder="Enter your complete store address"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {formData.sellerType === "vyronamallconnect" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mallName">Mall Name *</Label>
                  <Input
                    id="mallName"
                    value={formData.mallName || ""}
                    onChange={(e) => updateFormData({ mallName: e.target.value })}
                    placeholder="Enter mall name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName || ""}
                    onChange={(e) => updateFormData({ brandName: e.target.value })}
                    placeholder="Enter brand name (if applicable)"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hasExistingOnlinePresence">Do you have existing online presence?</Label>
              <Select onValueChange={(value) => updateFormData({ hasExistingOnlinePresence: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I already sell online</SelectItem>
                  <SelectItem value="no">No, this is my first online venture</SelectItem>
                  <SelectItem value="planning">I'm planning to start online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Legal & Tax Information</h3>
              <p className="text-gray-600">Required for compliance and payments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber || ""}
                  onChange={(e) => updateFormData({ gstNumber: e.target.value })}
                  placeholder="Enter GST number (if applicable)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber || ""}
                  onChange={(e) => updateFormData({ panNumber: e.target.value })}
                  placeholder="Enter PAN number"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Review Your Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Platform:</strong> {sellerTypes.find(t => t.id === formData.sellerType)?.title}</p>
                <p><strong>Business:</strong> {formData.businessName}</p>
                <p><strong>Owner:</strong> {formData.ownerName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Category:</strong> {formData.businessCategory}</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Next Steps:</strong> After submission, our team will review your application within 2-3 business days. 
                You'll receive an email with your account setup instructions and onboarding materials.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.sellerType !== null;
      case 2:
        return formData.businessName && formData.ownerName && formData.email && formData.phone && formData.businessCategory;
      case 3:
        if (formData.sellerType === "vyronainstastore") {
          return formData.instagramHandle;
        }
        if (formData.sellerType === "vyronaspace") {
          return formData.storeAddress;
        }
        if (formData.sellerType === "vyronamallconnect") {
          return formData.mallName;
        }
        return true;
      case 4:
        return formData.panNumber;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Become a VyronaMart Seller
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {renderStepContent()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                Submit Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}