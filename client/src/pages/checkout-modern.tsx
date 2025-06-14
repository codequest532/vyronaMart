import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UPIPaymentModal } from "@/components/UPIPaymentModal";
import {
  ArrowLeft,
  Users,
  Package,
  MapPin,
  CheckCircle,
  Wallet,
  Smartphone,
  Plus,
  Clock,
  Target,
  User,
  Heart,
  Zap,
  TrendingUp,
  Award,
  Star,
  Gift,
  ArrowRight,
  Crown,
  Shield,
  Sparkles,
  Flame,
  Gem,
  QrCode
} from "lucide-react";

// Interfaces (same as original)
interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  contributedAmount: number;
  targetAmount: number;
  isFullyFunded: boolean;
  contributors: ItemContributor[];
  assignedMember?: {
    userId: number;
    username: string;
    deliveryAddress?: DeliveryAddress;
  };
}

interface ItemContributor {
  userId: number;
  username: string;
  amount: number;
  paymentMethod: 'wallet' | 'googlepay' | 'phonepe' | 'cod' | 'upi';
  status: 'pending' | 'contributed' | 'confirmed';
  transactionId?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'wallet' | 'googlepay' | 'phonepe' | 'cod' | 'upi';
  icon: string;
  enabled: boolean;
  requiresFullPayment?: boolean;
  apiEndpoint?: string;
  description: string;
  color: string;
}

interface ContributionTarget {
  itemId: number;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progress: number;
  isComplete: boolean;
}

interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CheckoutState {
  items: OrderItem[];
  contributionTargets: ContributionTarget[];
  totalCartValue: number;
  totalContributed: number;
  allItemsFunded: boolean;
  canProceedToOrder: boolean;
  codEligible: boolean;
  deliveryAddress: DeliveryAddress | null;
  savedAddresses: DeliveryAddress[];
  primaryAddress: DeliveryAddress | null;
  memberSpecificAddresses: Record<number, DeliveryAddress>;
}

export default function ModernCheckout() {
  const { roomId: roomIdParam } = useParams();
  const roomId = roomIdParam ? Number(roomIdParam) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    items: [],
    contributionTargets: [],
    totalCartValue: 0,
    totalContributed: 0,
    allItemsFunded: false,
    canProceedToOrder: false,
    codEligible: false,
    deliveryAddress: null,
    savedAddresses: [],
    primaryAddress: null,
    memberSpecificAddresses: {}
  });

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [upiPaymentDetails, setUpiPaymentDetails] = useState<{
    roomId: number;
    itemId: number;
    amount: number;
    userId: number;
  } | null>(null);

  // Simplified address states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isPrimary: false
  });
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);

  // Data fetching
  const { data: cartItemsResponse } = useQuery({
    queryKey: ["/api/room-cart", roomId],
    queryFn: () => fetch(`/api/room-cart/${roomId}`).then(res => res.json()),
    enabled: !!roomId,
  });

  const { data: roomsResponse } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    queryFn: () => fetch("/api/shopping-rooms").then(res => res.json()),
  });

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance/1"],
    queryFn: () => fetch("/api/wallet/balance/1").then(res => res.json()),
  });

  const { data: groupMembers } = useQuery({
    queryKey: ["/api/social/groups", roomId, "members"],
    queryFn: () => fetch(`/api/social/groups/${roomId}/members`).then(res => res.json()),
    enabled: !!roomId,
  });

  const { data: groupContributions, refetch: refetchContributions } = useQuery({
    queryKey: ["/api/groups", roomId, "contributions"],
    queryFn: () => fetch(`/api/groups/${roomId}/contributions`).then(res => res.json()),
    enabled: !!roomId,
    refetchInterval: 2000,
  });

  const cartItems = Array.isArray(cartItemsResponse) ? cartItemsResponse : [];
  const room = Array.isArray(roomsResponse) ? roomsResponse.find(r => r.id === roomId) : null;

  // UPI QR Code payment method only
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi-qr',
      name: 'UPI QR Code',
      type: 'upi',
      icon: 'qr',
      enabled: true,
      apiEndpoint: '/api/payments/upi-qr/generate',
      description: 'Scan & Pay with Cashfree',
      color: 'from-indigo-400 to-purple-500'
    }
  ];

  // Initialize checkout state with real-time backend data
  useEffect(() => {
    if (!cartItems.length || !room?.memberCount) return;
    
    const contributionItems: OrderItem[] = cartItems.map(item => {
      const itemContributions = groupContributions?.filter((contrib: any) => contrib.cartItemId === item.id) || [];
      const totalContributed = itemContributions.reduce((sum: number, contrib: any) => sum + (contrib.amount / 100), 0);
      
      const contributors: ItemContributor[] = itemContributions.map((contrib: any) => ({
        userId: contrib.userId,
        username: contrib.username,
        amount: contrib.amount / 100,
        paymentMethod: contrib.paymentMethod as 'wallet' | 'googlepay' | 'phonepe' | 'cod',
        status: contrib.status === 'completed' ? 'contributed' : 'pending',
        transactionId: contrib.transactionId
      }));

      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl,
        contributedAmount: totalContributed,
        targetAmount: item.price * (item.quantity || 1),
        isFullyFunded: totalContributed >= (item.price * (item.quantity || 1)),
        contributors
      };
    });

    const targets: ContributionTarget[] = contributionItems.map(item => ({
      itemId: item.id,
      targetAmount: item.targetAmount,
      currentAmount: item.contributedAmount,
      remainingAmount: item.targetAmount - item.contributedAmount,
      progress: (item.contributedAmount / item.targetAmount) * 100,
      isComplete: item.isFullyFunded
    }));

    const totalCartValue = contributionItems.reduce((sum, item) => sum + item.targetAmount, 0);
    const totalContributed = contributionItems.reduce((sum, item) => sum + item.contributedAmount, 0);
    const codEligible = room.memberCount === 1;

    setCheckoutState({
      items: contributionItems,
      contributionTargets: targets,
      totalCartValue,
      totalContributed,
      allItemsFunded: contributionItems.every(item => item.isFullyFunded),
      canProceedToOrder: contributionItems.every(item => item.isFullyFunded),
      codEligible,
      deliveryAddress: null,
      savedAddresses: [],
      primaryAddress: null,
      memberSpecificAddresses: {}
    });
  }, [cartItems, room?.memberCount, groupContributions]);

  // Handle contribution
  const addContribution = async (itemId: number, amount: number, paymentMethod: PaymentMethod) => {
    try {
      if (paymentMethod.type === 'upi') {
        // Handle UPI QR code payment
        setUpiPaymentDetails({
          roomId: roomId,
          itemId: itemId,
          amount: amount,
          userId: 1 // Current user ID
        });
        setShowUPIModal(true);
        setIsContributionModalOpen(false);
        return;
      }

      // Save contribution to backend
      const contributionResponse = await fetch(`/api/groups/${roomId}/contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId: itemId,
          amount,
          paymentMethod: paymentMethod.type,
          transactionId: `${paymentMethod.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
      });

      if (!contributionResponse.ok) {
        toast({
          title: "Error",
          description: "Failed to save contribution. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await refetchContributions();

      toast({
        title: "Contribution Added!",
        description: `Successfully contributed ₹${amount)} via ${paymentMethod.name}`,
      });

      setIsContributionModalOpen(false);
      setContributionAmount("");
    } catch (error) {
      console.error("Error adding contribution:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContributeClick = (item: OrderItem) => {
    setSelectedItem(item);
    setIsContributionModalOpen(true);
  };

  const handleSaveAddress = () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const address: DeliveryAddress = {
      id: Date.now().toString(),
      fullName: newAddress.fullName,
      phone: newAddress.phone,
      addressLine1: newAddress.addressLine1,
      addressLine2: newAddress.addressLine2 || '',
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
      isDefault: newAddress.isPrimary
    };

    setDeliveryAddress(address);
    
    // Reset form
    setNewAddress({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      isPrimary: false
    });
    setShowAddressModal(false);

    toast({
      title: "Address Saved",
      description: newAddress.isPrimary ? "Primary delivery address set for all items" : "Delivery address saved successfully",
    });
  };;

  // Handle UPI payment success
  const handleUPIPaymentSuccess = async (referenceId: string) => {
    if (!upiPaymentDetails) return;

    try {
      // Save contribution to backend
      const contributionResponse = await fetch(`/api/groups/${roomId}/contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId: upiPaymentDetails.itemId,
          amount: Math.round(upiPaymentDetails.amount * 100), // Convert to cents
          paymentMethod: 'upi',
          transactionId: referenceId,
          userId: upiPaymentDetails.userId
        }),
      });

      if (contributionResponse.ok) {
        toast({
          title: "Contribution Added!",
          description: `₹${upiPaymentDetails.amount} contributed successfully via UPI`,
        });
        
        // Refresh contributions data
        refetchContributions();
        setContributionAmount("");
        setUpiPaymentDetails(null);
      } else {
        throw new Error('Failed to save contribution');
      }
    } catch (error) {
      console.error('Error saving UPI contribution:', error);
      toast({
        title: "Error",
        description: "Failed to save contribution. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Debug logging
  console.log("Room ID:", roomId);
  console.log("Rooms Response:", roomsResponse);
  console.log("Room found:", room);
  console.log("Cart Items:", cartItems);

  if (!roomId || !roomsResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading your group checkout...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-xl font-semibold">Group Not Found</div>
          <p className="text-gray-600">The group with ID {roomId} could not be found.</p>
          <Button onClick={() => setLocation("/social")} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-transparent"></div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/social")}
                className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Button>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold">Group Checkout</h1>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Live Sync
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-300" />
                    <span className="font-medium">{room.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-300" />
                    <span>{room.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-300" />
                    <span>{checkoutState.items.length} items</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-yellow-300">
                  {Math.round((checkoutState.totalContributed / checkoutState.totalCartValue) * 100)}%
                </div>
                <div className="text-sm text-white/80">Funded</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-green-300">
                  ₹{checkoutState.totalContributed.toFixed(0)}
                </div>
                <div className="text-sm text-white/80">Contributed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Overview */}
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl text-white">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">Funding Progress</span>
                    <div className="text-sm text-gray-600 font-normal">Real-time contribution tracking</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Total Progress</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {Math.round((checkoutState.totalContributed / checkoutState.totalCartValue) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(checkoutState.totalContributed / checkoutState.totalCartValue) * 100} 
                    className="h-3 bg-purple-100"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{checkoutState.totalContributed)} contributed</span>
                    <span>₹{checkoutState.totalCartValue)} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <div className="space-y-6">
              {checkoutState.items.map((item) => {
                const progress = (item.contributedAmount / item.targetAmount) * 100;
                return (
                  <Card key={item.id} className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/50 border-2 border-purple-100 hover:border-purple-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                    {/* Status Indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-2 ${item.isFullyFunded ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-yellow-500'}`} />
                    
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        {/* Enhanced Item Display */}
                        <div className="relative">
                          {item.imageUrl ? (
                            <div className="relative">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-32 h-32 object-cover rounded-2xl shadow-lg"
                              />
                              {item.isFullyFunded && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg animate-pulse">
                                  <CheckCircle className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
                              <Package className="h-12 w-12 text-purple-500" />
                              {item.isFullyFunded && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg animate-pulse">
                                  <CheckCircle className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-purple-600 border-purple-300">
                                ₹{item.price)}
                              </Badge>
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                Qty: {item.quantity}
                              </Badge>
                              {item.isFullyFunded ? (
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fully Funded
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Needs ₹{Math.round(item.targetAmount - item.contributedAmount)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Funding Progress</span>
                              <span className="font-bold text-purple-600">{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>₹{item.contributedAmount)} raised</span>
                              <span>₹{item.targetAmount)} goal</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          {!item.isFullyFunded && (
                            <Button
                              onClick={() => handleContributeClick(item)}
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Heart className="h-5 w-5 mr-2" />
                              Contribute Now
                            </Button>
                          )}

                          {/* Contributors */}
                          {item.contributors.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Contributors ({item.contributors.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {item.contributors.map((contributor, index) => (
                                  <div key={index} className="flex items-center justify-between bg-white/70 p-3 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                        {contributor.username[0].toUpperCase()}
                                      </div>
                                      <span className="font-medium">{contributor.username}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-green-600">₹{contributor.amount)}</div>
                                      <Badge variant="outline" className="text-xs">
                                        {contributor.paymentMethod}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Delivery Address Section */}
            <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6" />
                    Multiple Delivery Addresses
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressList(!showAddressList)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {showAddressList ? 'Hide' : 'Show'} All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Primary Address */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      Primary Delivery Address
                    </h3>
                    {checkoutState.primaryAddress ? (
                      <div className="p-4 bg-white rounded-lg border-2 border-yellow-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {checkoutState.primaryAddress.fullName}
                              <Badge className="bg-yellow-500 text-white text-xs">PRIMARY</Badge>
                            </p>
                            <p className="text-sm text-gray-600">{checkoutState.primaryAddress.phone}</p>
                            <p className="text-sm">{checkoutState.primaryAddress.addressLine1}</p>
                            {checkoutState.primaryAddress.addressLine2 && (
                              <p className="text-sm">{checkoutState.primaryAddress.addressLine2}</p>
                            )}
                            <p className="text-sm">{checkoutState.primaryAddress.city}, {checkoutState.primaryAddress.state} {checkoutState.primaryAddress.pincode}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddressType('primary');
                              setSelectedMemberForAddress(null);
                              setShowAddressModal(true);
                            }}
                            className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setAddressType('primary');
                          setSelectedMemberForAddress(null);
                          setShowAddressModal(true);
                        }}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 rounded-xl"
                      >
                        <Crown className="h-5 w-5 mr-2" />
                        Add Primary Address
                      </Button>
                    )}
                  </div>

                  {/* Member-Specific Addresses */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Member-Specific Addresses
                    </h3>
                    <div className="space-y-3">
                      {groupMembers?.map((member: any) => (
                        <div key={member.userId} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{member.username}</span>
                            {checkoutState.memberSpecificAddresses[member.userId] ? (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                Address Set
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddressType('member-specific');
                                  setSelectedMemberForAddress(member.userId);
                                  setShowAddressModal(true);
                                }}
                                className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Address
                              </Button>
                            )}
                          </div>
                          {checkoutState.memberSpecificAddresses[member.userId] && (
                            <div className="text-xs text-gray-600 space-y-1">
                              <p className="font-medium">{checkoutState.memberSpecificAddresses[member.userId].fullName}</p>
                              <p>{checkoutState.memberSpecificAddresses[member.userId].addressLine1}</p>
                              <p>{checkoutState.memberSpecificAddresses[member.userId].city}, {checkoutState.memberSpecificAddresses[member.userId].state}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Address Summary */}
                {showAddressList && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Delivery Address Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {checkoutState.primaryAddress && (
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="text-xs font-semibold text-yellow-600 mb-1">PRIMARY ADDRESS</p>
                          <p className="text-sm font-medium">{checkoutState.primaryAddress.fullName}</p>
                          <p className="text-xs text-gray-600">{checkoutState.primaryAddress.city}, {checkoutState.primaryAddress.state}</p>
                        </div>
                      )}
                      {Object.entries(checkoutState.memberSpecificAddresses).map(([memberId, address]) => {
                        const member = groupMembers?.find((m: any) => m.userId === parseInt(memberId));
                        return (
                          <div key={memberId} className="bg-white p-3 rounded border border-blue-200">
                            <p className="text-xs font-semibold text-blue-600 mb-1">{member?.username?.toUpperCase()}</p>
                            <p className="text-sm font-medium">{address.fullName}</p>
                            <p className="text-xs text-gray-600">{address.city}, {address.state}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Item Assignment & Delivery Coordination */}
            <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Package className="h-6 w-6" />
                  Item Assignment & Delivery Coordination
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Item Assignments
                    </h3>
                    <div className="space-y-3">
                      {checkoutState.items.map((item) => (
                        <div key={item.id} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <select
                              value={itemMemberAssignments[item.id] || ""}
                              onChange={(e) => setItemMemberAssignments(prev => ({
                                ...prev,
                                [item.id]: parseInt(e.target.value)
                              }))}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Assign to member...</option>
                              {groupMembers?.map((member: any) => (
                                <option key={member.userId} value={member.userId}>
                                  {member.username}
                                </option>
                              ))}
                            </select>
                          </div>
                          {itemMemberAssignments[item.id] && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                              <p className="text-xs text-blue-700">
                                Assigned to: {groupMembers?.find((m: any) => m.userId === itemMemberAssignments[item.id])?.username}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {Object.keys(itemMemberAssignments).length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">
                          Items will be delivered to individual members at their specified addresses.
                        </p>
                      </div>
                    )}

                    {/* Delivery Coordination Summary */}
                    {Object.keys(itemMemberAssignments).length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-3">Delivery Coordination Plan</h4>
                        <div className="space-y-2">
                          {Object.entries(itemMemberAssignments).map(([itemId, memberId]) => {
                            const item = checkoutState.items.find(i => i.id === parseInt(itemId));
                            const member = groupMembers?.find((m: any) => m.userId === memberId);
                            const memberAddress = checkoutState.memberSpecificAddresses[memberId];
                            const fallbackAddress = checkoutState.primaryAddress;
                            
                            return (
                              <div key={itemId} className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex items-center gap-3">
                                  <Package className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-sm">{item?.name}</span>
                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm text-blue-600">{member?.username}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {memberAddress ? (
                                    <span className="text-green-600 font-medium">Specific Address</span>
                                  ) : fallbackAddress ? (
                                    <span className="text-yellow-600 font-medium">Primary Address</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">No Address Set</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-200 shadow-xl sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Items Total</span>
                    <span className="text-xl font-bold">₹{checkoutState.totalCartValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Contributed</span>
                    <span className="text-xl font-bold text-green-600">₹{checkoutState.totalContributed)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Remaining</span>
                    <span className="text-xl font-bold text-orange-600">₹{Math.round(checkoutState.totalCartValue - checkoutState.totalContributed)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Order Total</span>
                    <span className="text-2xl font-bold text-purple-600">₹{checkoutState.totalCartValue)}</span>
                  </div>
                </div>

                {checkoutState.allItemsFunded ? (
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 text-lg rounded-xl shadow-lg">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Place Order
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-orange-700 font-medium">Waiting for full funding</p>
                    <p className="text-sm text-orange-600">₹{Math.round(checkoutState.totalCartValue - checkoutState.totalContributed)} still needed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      <Dialog open={isContributionModalOpen} onOpenChange={setIsContributionModalOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-purple-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg text-white">
                <Heart className="h-6 w-6" />
              </div>
              Contribute to {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Choose your contribution amount and payment method
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-lg font-semibold">Contribution Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="pl-8 text-lg py-3 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Remaining: ₹{Math.round(selectedItem.targetAmount - selectedItem.contributedAmount)}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Choose Payment Method</Label>
                <div className="grid grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant="outline"
                      className={`group relative p-6 h-auto flex flex-col items-center gap-3 transition-all duration-300 border-2 ${
                        method.enabled 
                          ? 'hover:scale-105 hover:shadow-lg border-purple-200 hover:border-purple-400' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!method.enabled || !contributionAmount}
                      onClick={() => {
                        const amount = parseFloat(contributionAmount);
                        if (amount > 0) {
                          addContribution(selectedItem.id, amount, method);
                        }
                      }}
                    >
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${method.color} text-white`}>
                        {method.id === 'wallet' && <Wallet className="h-8 w-8" />}
                        {method.id === 'upi-qr' && <QrCode className="h-8 w-8" />}
                        {method.id === 'googlepay' && <Smartphone className="h-8 w-8" />}
                        {method.id === 'phonepe' && <Zap className="h-8 w-8" />}
                        {method.id === 'cod' && <Gift className="h-8 w-8" />}
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* UPI Payment Modal */}
      {upiPaymentDetails && (
        <UPIPaymentModal
          isOpen={showUPIModal}
          onClose={() => {
            setShowUPIModal(false);
            setUpiPaymentDetails(null);
          }}
          roomId={upiPaymentDetails.roomId}
          itemId={upiPaymentDetails.itemId}
          amount={upiPaymentDetails.amount}
          userId={upiPaymentDetails.userId}
          onPaymentSuccess={handleUPIPaymentSuccess}
        />
      )}

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-green-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg text-white">
                <MapPin className="h-6 w-6" />
              </div>
              {addressType === 'primary' ? 'Add Primary Address' : `Add Address for ${groupMembers?.find((m: any) => m.userId === selectedMemberForAddress)?.username}`}
            </DialogTitle>
            <DialogDescription>
              {addressType === 'primary' ? 'This will be the main delivery address for the group' : 'This address will be used specifically for this member'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newAddress.fullName || ""}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newAddress.phone || ""}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={newAddress.addressLine1 || ""}
                onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="House/Flat No., Building, Street"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                value={newAddress.addressLine2 || ""}
                onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Area, Landmark"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newAddress.city || ""}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={newAddress.state || ""}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={newAddress.pincode || ""}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Enter pincode"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newAddress.isDefault || false}
                onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded border-green-300 focus:ring-green-500"
              />
              <Label htmlFor="isDefault" className="text-sm">
                Set as default address
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddressModal(false)}
                className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}