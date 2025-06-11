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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ArrowLeft, ArrowRight, Instagram, Store, Users, Building, ShoppingBag, BookOpen, Upload, FileText, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SellerType = "vyronainstastore" | "vyronahub" | "vyronaspace" | "vyronamallconnect" | "vyronaread" | null;

interface FormData {
  sellerType: SellerType;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessCategory: string;
  businessDescription: string;
  
  // VyronaInstaStore fields
  instagramHandle?: string;
  instagramBusinessLink?: string;
  autoFetchInstagram?: boolean;
  productUploadMode?: string;
  enableGroupBuy?: boolean;
  storeBio?: string;
  deliveryMode?: string;
  codEnabled?: boolean;
  
  // VyronaHub & VyronaSocial fields
  websiteUrl?: string;
  fulfillmentPartner?: string;
  storePincode?: string;
  
  // VyronaSpace fields
  storeAddress?: string;
  workingHours?: string;
  deliveryCoverage?: string;
  whoDelivers?: string;
  minOrderFreeDelivery?: string;
  
  // VyronaMallConnect fields
  mallName?: string;
  brandName?: string;
  storeLocationInMall?: string;
  brandWebsite?: string;
  deliveryPincodeSupport?: string;
  specialLaunchOffer?: string;
  
  // VyronaRead fields
  storeLibraryName?: string;
  businessAddress?: string;
  listingTypes?: string[];
  businessType?: string;
  estimatedBooks?: string;
  pickupDropService?: string;
  libraryIntegration?: string;
  bankName?: string;
  upiId?: string;
  addressProof?: File;
  idProof?: File;
  businessProof?: File;
  logoFile?: File;
  
  // Legal & Payout
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  
  // Final consent
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  
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
  },
  {
    id: "vyronaread" as const,
    title: "VyronaRead",
    description: "For book sellers, libraries & educational institutions",
    icon: BookOpen,
    color: "bg-gradient-to-br from-amber-500 to-yellow-600",
    features: ["Book Sales", "Rentals", "Library Management", "Digital Books", "Educational Content"]
  }
];

export default function SellerOnboardingModal({ isOpen, onClose }: SellerOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    sellerType: null,
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessCategory: "",
    businessDescription: "",
    expectedMonthlyRevenue: "",
    hasExistingOnlinePresence: "",
    // VyronaRead specific fields
    listingTypes: [],
    businessType: "",
    estimatedBooks: "",
    pickupDropService: "",
    libraryIntegration: ""
  });

  const totalSteps = 5;
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
              <p className="text-gray-600">Complete your {sellerTypes.find(t => t.id === formData.sellerType)?.title} setup</p>
            </div>

            {formData.sellerType === "vyronainstastore" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="instagramBusinessLink">Instagram Business Link</Label>
                    <Input
                      id="instagramBusinessLink"
                      value={formData.instagramBusinessLink || ""}
                      onChange={(e) => updateFormData({ instagramBusinessLink: e.target.value })}
                      placeholder="Instagram business profile URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productUploadMode">Product Upload Mode</Label>
                    <Select onValueChange={(value) => updateFormData({ productUploadMode: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select upload mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram-sync">Instagram Sync</SelectItem>
                        <SelectItem value="manual">Manual Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryMode">Delivery Mode</Label>
                    <Select onValueChange={(value) => updateFormData({ deliveryMode: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self Delivery</SelectItem>
                        <SelectItem value="vyrona">Vyrona Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeBio">Store Bio</Label>
                  <Textarea
                    id="storeBio"
                    value={formData.storeBio || ""}
                    onChange={(e) => updateFormData({ storeBio: e.target.value })}
                    placeholder="Describe your Instagram store"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableGroupBuy"
                    checked={formData.enableGroupBuy || false}
                    onChange={(e) => updateFormData({ enableGroupBuy: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="enableGroupBuy">Enable Group Buy (VyronaSocial)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="codEnabled"
                    checked={formData.codEnabled || false}
                    onChange={(e) => updateFormData({ codEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="codEnabled">Enable Cash on Delivery</Label>
                </div>
              </div>
            )}

            {formData.sellerType === "vyronahub" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl || ""}
                      onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storePincode">Store Pincode</Label>
                    <Input
                      id="storePincode"
                      value={formData.storePincode || ""}
                      onChange={(e) => updateFormData({ storePincode: e.target.value })}
                      placeholder="Store location pincode"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fulfillmentPartner">Fulfillment Partner</Label>
                    <Select onValueChange={(value) => updateFormData({ fulfillmentPartner: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fulfillment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self Fulfillment</SelectItem>
                        <SelectItem value="vyrona">Vyrona Logistics</SelectItem>
                        <SelectItem value="other">Other Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productUploadMode">Product Upload Mode</Label>
                    <Select onValueChange={(value) => updateFormData({ productUploadMode: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select upload mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Upload</SelectItem>
                        <SelectItem value="csv">CSV Bulk Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableGroupBuy"
                    checked={formData.enableGroupBuy || false}
                    onChange={(e) => updateFormData({ enableGroupBuy: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="enableGroupBuy">Enable Group Buy Features</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="codEnabled"
                    checked={formData.codEnabled || false}
                    onChange={(e) => updateFormData({ codEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="codEnabled">Enable Cash on Delivery</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Working Hours</Label>
                    <Input
                      id="workingHours"
                      value={formData.workingHours || ""}
                      onChange={(e) => updateFormData({ workingHours: e.target.value })}
                      placeholder="e.g., 9 AM - 9 PM"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minOrderFreeDelivery">Min Order for Free Delivery</Label>
                    <Input
                      id="minOrderFreeDelivery"
                      value={formData.minOrderFreeDelivery || ""}
                      onChange={(e) => updateFormData({ minOrderFreeDelivery: e.target.value })}
                      placeholder="₹500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryCoverage">Delivery Coverage</Label>
                    <Select onValueChange={(value) => updateFormData({ deliveryCoverage: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coverage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Only</SelectItem>
                        <SelectItem value="all-india">All India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whoDelivers">Who Delivers?</Label>
                    <Select onValueChange={(value) => updateFormData({ whoDelivers: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery partner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self Delivery</SelectItem>
                        <SelectItem value="vyrona">Vyrona Logistics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="codEnabled"
                    checked={formData.codEnabled || false}
                    onChange={(e) => updateFormData({ codEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="codEnabled">Enable Cash on Delivery</Label>
                </div>
              </div>
            )}

            {formData.sellerType === "vyronamallconnect" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeLocationInMall">Store Location in Mall</Label>
                    <Input
                      id="storeLocationInMall"
                      value={formData.storeLocationInMall || ""}
                      onChange={(e) => updateFormData({ storeLocationInMall: e.target.value })}
                      placeholder="Floor 2, Shop No. 45"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandWebsite">Brand Website</Label>
                    <Input
                      id="brandWebsite"
                      value={formData.brandWebsite || ""}
                      onChange={(e) => updateFormData({ brandWebsite: e.target.value })}
                      placeholder="https://yourbrand.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fulfillmentPartner">Fulfillment Partner</Label>
                    <Select onValueChange={(value) => updateFormData({ fulfillmentPartner: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fulfillment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Brand Fulfillment</SelectItem>
                        <SelectItem value="vyrona">Vyrona Logistics</SelectItem>
                        <SelectItem value="mall">Mall Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productUploadMode">Product Upload Mode</Label>
                    <Select onValueChange={(value) => updateFormData({ productUploadMode: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select upload mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Upload</SelectItem>
                        <SelectItem value="csv">CSV Bulk Upload</SelectItem>
                        <SelectItem value="api">API Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryPincodeSupport">Delivery Pincode Support</Label>
                  <Textarea
                    id="deliveryPincodeSupport"
                    value={formData.deliveryPincodeSupport || ""}
                    onChange={(e) => updateFormData({ deliveryPincodeSupport: e.target.value })}
                    placeholder="Enter supported pincodes separated by commas"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialLaunchOffer">Special Launch Offer (Optional)</Label>
                  <Textarea
                    id="specialLaunchOffer"
                    value={formData.specialLaunchOffer || ""}
                    onChange={(e) => updateFormData({ specialLaunchOffer: e.target.value })}
                    placeholder="Describe any special offers for launch"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="codEnabled"
                    checked={formData.codEnabled || false}
                    onChange={(e) => updateFormData({ codEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="codEnabled">Enable Cash on Delivery</Label>
                </div>
              </div>
            )}

            {formData.sellerType === "vyronaread" && (
              <div className="space-y-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">VyronaRead Book Seller Registration</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Complete registration for books, rentals, and library services
                  </p>
                </div>

                {/* Store/Library Information */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">Store/Library Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeLibraryName">Store/Library Name *</Label>
                      <Input
                        id="storeLibraryName"
                        value={formData.storeLibraryName || ""}
                        onChange={(e) => updateFormData({ storeLibraryName: e.target.value })}
                        placeholder="Enter your store or library name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Business Address *</Label>
                      <Input
                        id="businessAddress"
                        value={formData.businessAddress || ""}
                        onChange={(e) => updateFormData({ businessAddress: e.target.value })}
                        placeholder="Complete business address"
                      />
                    </div>
                  </div>
                </div>

                {/* Listing Types */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">What will you list?</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {["New Books", "Used Books", "Book Rentals", "Digital/E-books"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={formData.listingTypes?.includes(type) || false}
                          onCheckedChange={(checked) => {
                            const current = formData.listingTypes || [];
                            if (checked) {
                              updateFormData({ listingTypes: [...current, type] });
                            } else {
                              updateFormData({ listingTypes: current.filter(t => t !== type) });
                            }
                          }}
                        />
                        <Label htmlFor={type} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Type */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">Business Type</h5>
                  <Select onValueChange={(value) => updateFormData({ businessType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Seller</SelectItem>
                      <SelectItem value="bookstore">Book Store</SelectItem>
                      <SelectItem value="library">Library</SelectItem>
                      <SelectItem value="educational">Educational Institution</SelectItem>
                      <SelectItem value="publishing">Publishing House</SelectItem>
                      <SelectItem value="distributor">Book Distributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Inventory & Logistics */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">Inventory & Logistics</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedBooks">Estimated Number of Books</Label>
                      <Select onValueChange={(value) => updateFormData({ estimatedBooks: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-50">1-50 books</SelectItem>
                          <SelectItem value="51-200">51-200 books</SelectItem>
                          <SelectItem value="201-500">201-500 books</SelectItem>
                          <SelectItem value="501-1000">501-1000 books</SelectItem>
                          <SelectItem value="1000+">1000+ books</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pickupDropService">Pickup/Drop Service</Label>
                      <Select onValueChange={(value) => updateFormData({ pickupDropService: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self-delivery">Self Delivery</SelectItem>
                          <SelectItem value="customer-pickup">Customer Pickup</SelectItem>
                          <SelectItem value="vyrona-logistics">Vyrona Logistics</SelectItem>
                          <SelectItem value="both">Both Options</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Library Integration */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">Library Integration (Optional)</h5>
                  <Select onValueChange={(value) => updateFormData({ libraryIntegration: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Do you want library management integration?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, integrate with existing library system</SelectItem>
                      <SelectItem value="vyrona-system">Use Vyrona's library management system</SelectItem>
                      <SelectItem value="no">No, just selling books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">Payment Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName || ""}
                        onChange={(e) => updateFormData({ bankName: e.target.value })}
                        placeholder="Enter your bank name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID (Optional)</Label>
                      <Input
                        id="upiId"
                        value={formData.upiId || ""}
                        onChange={(e) => updateFormData({ upiId: e.target.value })}
                        placeholder="your-upi@bank"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 border-b pb-2">Document Upload</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Address Proof *</span>
                      </Label>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => updateFormData({ addressProof: e.target.files?.[0] })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">Aadhaar, Passport, Utility Bill</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>ID Proof *</span>
                      </Label>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => updateFormData({ idProof: e.target.files?.[0] })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">PAN Card, Aadhaar, Driving License</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Business Proof</span>
                      </Label>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => updateFormData({ businessProof: e.target.files?.[0] })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">GST Certificate, Shop License (if applicable)</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Store/Library Logo</span>
                      </Label>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => updateFormData({ logoFile: e.target.files?.[0] })}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">Optional: Upload your logo</p>
                    </div>
                  </div>
                </div>

                {/* Special Features */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-3">VyronaRead Special Features</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="inventory-management" />
                      <Label htmlFor="inventory-management" className="text-sm text-blue-800">
                        Enable advanced inventory management
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rental-system" />
                      <Label htmlFor="rental-system" className="text-sm text-blue-800">
                        Enable book rental system with due date tracking
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="digital-library" />
                      <Label htmlFor="digital-library" className="text-sm text-blue-800">
                        Set up digital library for e-books
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="educational-tools" />
                      <Label htmlFor="educational-tools" className="text-sm text-blue-800">
                        Access to educational content management tools
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Legal & Payout Details</h3>
              <p className="text-gray-600">Required for compliance and payment processing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber || ""}
                  onChange={(e) => updateFormData({ panNumber: e.target.value })}
                  placeholder="Enter PAN number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber || ""}
                  onChange={(e) => updateFormData({ gstNumber: e.target.value })}
                  placeholder="Enter GST number (optional for individuals)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber || ""}
                  onChange={(e) => updateFormData({ bankAccountNumber: e.target.value })}
                  placeholder="Enter bank account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode || ""}
                  onChange={(e) => updateFormData({ ifscCode: e.target.value })}
                  placeholder="Enter IFSC code"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName || ""}
                  onChange={(e) => updateFormData({ accountHolderName: e.target.value })}
                  placeholder="Enter account holder name"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Document Upload (Optional)</h4>
              <p className="text-sm text-blue-700 mb-3">
                Upload documents for faster verification. You can also submit these later.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-blue-800">Cancelled Cheque / Passbook</Label>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="text-sm"
                  />
                </div>
                {formData.sellerType === "vyronamallconnect" && (
                  <div className="space-y-2">
                    <Label className="text-sm text-blue-800">Brand Authorization Letter</Label>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Review & Submit</h3>
              <p className="text-gray-600">Please review your information and agree to our terms</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Application Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Platform:</strong> {sellerTypes.find(t => t.id === formData.sellerType)?.title}</p>
                  <p><strong>Business:</strong> {formData.businessName}</p>
                  <p><strong>Owner:</strong> {formData.ownerName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                </div>
                <div>
                  <p><strong>Category:</strong> {formData.businessCategory}</p>
                  {formData.instagramHandle && <p><strong>Instagram:</strong> {formData.instagramHandle}</p>}
                  {formData.mallName && <p><strong>Mall:</strong> {formData.mallName}</p>}
                  {formData.storeAddress && <p><strong>Store:</strong> {formData.storeAddress?.substring(0, 50)}...</p>}
                  <p><strong>Revenue:</strong> {formData.expectedMonthlyRevenue}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={formData.agreeTerms || false}
                  onChange={(e) => updateFormData({ agreeTerms: e.target.checked })}
                  className="mt-1 rounded"
                />
                <Label htmlFor="agreeTerms" className="text-sm leading-5">
                  I agree to the <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a> of VyronaMart seller program
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreePrivacy"
                  checked={formData.agreePrivacy || false}
                  onChange={(e) => updateFormData({ agreePrivacy: e.target.checked })}
                  className="mt-1 rounded"
                />
                <Label htmlFor="agreePrivacy" className="text-sm leading-5">
                  I agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> and consent to data processing
                </Label>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">What happens next?</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Your application will be reviewed within 2-3 business days</p>
                <p>• You'll receive an email with verification status and next steps</p>
                <p>• Once approved, you'll get access to your seller dashboard</p>
                <p>• Our onboarding team will guide you through product listing</p>
              </div>
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
        if (formData.sellerType === "vyronaread") {
          return formData.storeLibraryName && formData.businessAddress && formData.listingTypes && formData.listingTypes.length > 0;
        }
        return true;
      case 4:
        return formData.panNumber && formData.bankAccountNumber && formData.ifscCode && formData.accountHolderName;
      case 5:
        return formData.agreeTerms && formData.agreePrivacy;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      // Submit registration data to backend
      const response = await fetch("/api/seller/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const result = await response.json();
      
      toast({
        title: "Registration Successful!",
        description: `Your ${sellerTypes.find(t => t.id === formData.sellerType)?.title} seller application has been submitted.`,
      });
      
      // Close the modal
      onClose();
      
      // For VyronaRead sellers, automatically log them in and redirect to book seller dashboard
      if (formData.sellerType === "vyronaread" && result.credentials) {
        // Auto-login the VyronaRead seller
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: result.credentials.email,
            password: result.credentials.password,
          }),
        });

        if (loginResponse.ok) {
          setLocation("/book-seller-dashboard");
          setTimeout(() => {
            toast({
              title: "Welcome to VyronaRead!",
              description: "You've been automatically logged in. Start by adding your first book or setting up library partnerships!",
            });
          }, 1000);
        } else {
          setLocation("/login");
          setTimeout(() => {
            toast({
              title: "Registration Complete",
              description: `Please login with your credentials: ${result.credentials.email}`,
            });
          }, 1000);
        }
      } else {
        // Redirect other sellers to the general seller dashboard
        setLocation("/seller-dashboard");
        setTimeout(() => {
          toast({
            title: "Welcome to VyronaMart!",
            description: "You've been redirected to your seller dashboard. Start setting up your store!",
          });
        }, 1000);
      }
      
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="seller-onboarding-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Become a VyronaMart Seller
          </DialogTitle>
          <div id="seller-onboarding-description" className="sr-only">
            Complete seller registration form to join VyronaMart marketplace
          </div>
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
                Register as Vyrona Seller
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}