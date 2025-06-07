import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  Package,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Wallet,
  Smartphone,
  Plus,
  Check,
  Clock
} from "lucide-react";

// Interfaces
interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface ShoppingRoom {
  id: number;
  name: string;
  roomCode: string;
  memberCount: number;
}

interface DeliveryAddress {
  id: string;
  memberName: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isRequired: boolean;
}

interface GroupContribution {
  userId: number;
  username: string;
  amount: number;
  status: 'pending' | 'contributed' | 'confirmed';
  paymentMethod: 'wallet' | 'upi';
}

interface GroupCheckoutState {
  currentTab: 'address' | 'payment' | 'confirm';
  addresses: DeliveryAddress[];
  contributions: GroupContribution[];
  totalContributed: number;
  isReadyToConfirm: boolean;
}

export default function PlaceOrder() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [groupCheckout, setGroupCheckout] = useState<GroupCheckoutState>({
    currentTab: 'address',
    addresses: [],
    contributions: [],
    totalContributed: 0,
    isReadyToConfirm: false
  });

  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'upi'>('wallet');

  const roomId = params?.roomId ? parseInt(params.roomId) : null;

  // Fetch cart items for the room
  const { data: cartItemsResponse, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/room-cart", roomId],
    queryFn: () => fetch(`/api/room-cart/${roomId}`).then(res => res.json()),
    enabled: !!roomId,
  });

  const cartItems = Array.isArray(cartItemsResponse) ? cartItemsResponse : [];

  // Fetch room details from shopping-rooms endpoint
  const { data: roomsResponse, isLoading: roomLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    queryFn: () => fetch("/api/shopping-rooms").then(res => res.json()),
  });

  const room = Array.isArray(roomsResponse) ? roomsResponse.find(r => r.id === roomId) : null;

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance/1"],
    queryFn: () => fetch("/api/wallet/balance/1").then(res => res.json()),
  });

  // Initialize checkout state based on room member count
  useEffect(() => {
    if (!room?.memberCount) return;
    
    const memberCount = parseInt(room.memberCount.toString());
    const initialAddresses: DeliveryAddress[] = [];
    const initialContributions: GroupContribution[] = [];
    
    // Create address entries based on member count
    for (let i = 0; i < memberCount; i++) {
      initialAddresses.push({
        id: `member-${i + 1}`,
        memberName: i === 0 ? 'Primary Member (Required)' : `Member ${i + 1} (Optional)`,
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        isRequired: i === 0
      });
      
      // Initialize contribution slots for each member
      initialContributions.push({
        userId: i + 1, // Mock user IDs for now
        username: i === 0 ? 'You' : `Member ${i + 1}`,
        amount: 0,
        status: 'pending',
        paymentMethod: 'wallet'
      });
    }
    
    setGroupCheckout(prev => ({
      ...prev,
      addresses: initialAddresses,
      contributions: initialContributions
    }));
  }, [room?.memberCount, roomId]);

  // Helper functions
  const updateAddress = (addressId: string, field: keyof DeliveryAddress, value: string) => {
    setGroupCheckout(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr => 
        addr.id === addressId 
          ? { ...addr, [field]: value }
          : addr
      )
    }));
  };

  const updateContribution = (userId: number, amount: number, paymentMethod: 'wallet' | 'upi') => {
    setGroupCheckout(prev => {
      const updatedContributions = prev.contributions.map(contrib => 
        contrib.userId === userId 
          ? { ...contrib, amount, paymentMethod, status: amount > 0 ? 'contributed' : 'pending' as const }
          : contrib
      );
      
      const totalContributed = updatedContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
      
      return {
        ...prev,
        contributions: updatedContributions,
        totalContributed,
        isReadyToConfirm: totalContributed >= orderTotal && prev.addresses[0].fullName !== ''
      };
    });
  };

  const handleTabChange = (tab: 'address' | 'payment' | 'confirm') => {
    setGroupCheckout(prev => ({ ...prev, currentTab: tab }));
  };

  // Calculate totals
  const orderTotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 50; // Standard group delivery fee
  const finalTotal = orderTotal + deliveryFee;

  // Order processing mutation
  const processOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/group-carts/checkout", orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully",
        description: "Your group order has been placed and members have been notified.",
      });
      setLocation("/social");
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed", 
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Contribution modal handlers
  const handleContributeClick = () => {
    setShowContributionModal(true);
  };

  const handleContributionSubmit = () => {
    const amount = parseFloat(contributionAmount);
    if (amount > 0) {
      updateContribution(1, amount, selectedPaymentMethod); // Assume user ID 1 for current user
      setShowContributionModal(false);
      setContributionAmount('');
      toast({
        title: "Contribution Added",
        description: `₹${amount} contribution added successfully.`,
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!groupCheckout.isReadyToConfirm) {
      toast({
        title: "Order Not Ready",
        description: "Please complete all required fields and ensure full payment coverage.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      roomId,
      items: cartItems,
      addresses: groupCheckout.addresses.filter(addr => addr.fullName),
      contributions: groupCheckout.contributions.filter(contrib => contrib.amount > 0),
      totalAmount: finalTotal
    };

    await processOrderMutation.mutateAsync(orderData);
  };

  const validateAddresses = () => {
    const primaryAddress = groupCheckout.addresses[0];
    return primaryAddress?.fullName && primaryAddress?.phone && primaryAddress?.addressLine1 && 
           primaryAddress?.city && primaryAddress?.state && primaryAddress?.pincode;
  };

  const canProceedToPayment = () => {
    return validateAddresses() && cartItems.length > 0;
  };

  const canProceedToConfirm = () => {
    return canProceedToPayment() && groupCheckout.totalContributed >= orderTotal;
  };

  if (cartLoading || roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!room || !roomId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Room Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The shopping room you're trying to access doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/social")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Social
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/social")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Social
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Group Checkout
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {room.name} • {room.memberCount} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {room.memberCount} members
              </Badge>
              <Badge variant="secondary">
                {room.roomCode}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Checkout Flow */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Complete Your Group Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs 
                  value={groupCheckout.currentTab} 
                  onValueChange={(value) => handleTabChange(value as any)}
                  className="space-y-6"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="address" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </TabsTrigger>
                    <TabsTrigger 
                      value="payment" 
                      disabled={!canProceedToPayment()}
                      className="gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Payment Method
                    </TabsTrigger>
                    <TabsTrigger 
                      value="confirm" 
                      disabled={!canProceedToConfirm()}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm Order
                    </TabsTrigger>
                  </TabsList>

                  {/* Address Tab */}
                  <TabsContent value="address" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Delivery Addresses</h3>
                        <Badge variant="outline">
                          {room.memberCount} member{room.memberCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Address Information
                            </p>
                            <p className="text-blue-700 dark:text-blue-300">
                              Primary address is required. Additional member addresses are optional but help with delivery coordination.
                            </p>
                          </div>
                        </div>
                      </div>

                      <ScrollArea className="h-96">
                        <div className="space-y-6">
                          {groupCheckout.addresses.map((address, index) => (
                            <Card key={address.id} className={`${address.isRequired ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      address.isRequired 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    {address.memberName}
                                  </CardTitle>
                                  {address.isRequired && (
                                    <Badge variant="destructive" size="sm">Required</Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`${address.id}-name`}>Full Name *</Label>
                                    <Input
                                      id={`${address.id}-name`}
                                      value={address.fullName}
                                      onChange={(e) => updateAddress(address.id, 'fullName', e.target.value)}
                                      placeholder="Enter full name"
                                      required={address.isRequired}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`${address.id}-phone`}>Phone Number *</Label>
                                    <Input
                                      id={`${address.id}-phone`}
                                      value={address.phone}
                                      onChange={(e) => updateAddress(address.id, 'phone', e.target.value)}
                                      placeholder="Enter phone number"
                                      required={address.isRequired}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`${address.id}-address1`}>Address Line 1 *</Label>
                                  <Input
                                    id={`${address.id}-address1`}
                                    value={address.addressLine1}
                                    onChange={(e) => updateAddress(address.id, 'addressLine1', e.target.value)}
                                    placeholder="House/Flat number, Building name"
                                    required={address.isRequired}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`${address.id}-address2`}>Address Line 2</Label>
                                  <Input
                                    id={`${address.id}-address2`}
                                    value={address.addressLine2 || ''}
                                    onChange={(e) => updateAddress(address.id, 'addressLine2', e.target.value)}
                                    placeholder="Area, Street, Landmark (Optional)"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor={`${address.id}-city`}>City *</Label>
                                    <Input
                                      id={`${address.id}-city`}
                                      value={address.city}
                                      onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                                      placeholder="City"
                                      required={address.isRequired}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`${address.id}-state`}>State *</Label>
                                    <Input
                                      id={`${address.id}-state`}
                                      value={address.state}
                                      onChange={(e) => updateAddress(address.id, 'state', e.target.value)}
                                      placeholder="State"
                                      required={address.isRequired}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`${address.id}-pincode`}>PIN Code *</Label>
                                    <Input
                                      id={`${address.id}-pincode`}
                                      value={address.pincode}
                                      onChange={(e) => updateAddress(address.id, 'pincode', e.target.value)}
                                      placeholder="PIN Code"
                                      required={address.isRequired}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleTabChange('payment')}
                          disabled={!canProceedToPayment()}
                        >
                          Continue to Payment
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Payment Tab */}
                  <TabsContent value="payment" className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Group Payment Method</h3>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                                VyronaSocial Group Payment
                              </p>
                              <p className="text-amber-700 dark:text-amber-300">
                                Only VyronaWallet and UPI payments are available for group orders. 
                                Credit/Debit cards are disabled for group checkout to ensure seamless contribution tracking.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Wallet className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">VyronaWallet</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Balance: ₹{walletData?.balance?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                  <Smartphone className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium">UPI Payment</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Pay via UPI apps</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Member Contributions</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <h4 className="font-medium">Total Amount Needed</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Includes products + delivery fee
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">₹{finalTotal.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Contribution Status</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ₹{groupCheckout.totalContributed.toFixed(2)} of ₹{finalTotal.toFixed(2)}
                                </span>
                                <Progress 
                                  value={(groupCheckout.totalContributed / finalTotal) * 100} 
                                  className="w-24"
                                />
                              </div>
                            </div>
                            
                            {groupCheckout.contributions.map((contribution) => (
                              <Card key={contribution.userId} className="border">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary">
                                          {contribution.username.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <h5 className="font-medium">{contribution.username}</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {contribution.paymentMethod === 'wallet' ? 'VyronaWallet' : 'UPI'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {contribution.status === 'contributed' ? (
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">₹{contribution.amount.toFixed(2)}</span>
                                          <Badge variant="default" className="bg-green-500">
                                            <Check className="h-3 w-3 mr-1" />
                                            Contributed
                                          </Badge>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          {contribution.userId === 1 ? (
                                            <Button size="sm" onClick={handleContributeClick}>
                                              <Plus className="h-4 w-4 mr-2" />
                                              Add Contribution
                                            </Button>
                                          ) : (
                                            <Badge variant="outline">
                                              <Clock className="h-3 w-3 mr-1" />
                                              Pending
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => handleTabChange('address')}
                        >
                          Back to Address
                        </Button>
                        <Button 
                          onClick={() => handleTabChange('confirm')}
                          disabled={!canProceedToConfirm()}
                        >
                          Review Order
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Confirm Tab */}
                  <TabsContent value="confirm" className="space-y-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Order Summary</h3>
                      
                      {/* Order Items */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Items in Your Cart</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {cartItems.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{item.name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Quantity: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    ₹{item.price.toFixed(2)} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payment Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{orderTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Delivery Fee:</span>
                              <span>₹{deliveryFee.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total:</span>
                              <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Total Contributed:</span>
                              <span>₹{groupCheckout.totalContributed.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Delivery Addresses Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Delivery Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {groupCheckout.addresses.filter(addr => addr.fullName).map((address) => (
                              <div key={address.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-medium">{address.fullName}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{address.phone}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                                      {address.city}, {address.state} - {address.pincode}
                                    </p>
                                  </div>
                                  {address.isRequired && (
                                    <Badge variant="outline" size="sm">Primary</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => handleTabChange('payment')}
                        >
                          Back to Payment
                        </Button>
                        <Button 
                          onClick={handlePlaceOrder}
                          disabled={processOrderMutation.isPending || !groupCheckout.isReadyToConfirm}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Place Group Order
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Items:</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Members:</span>
                    <span className="font-medium">{room.memberCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Subtotal:</span>
                    <span className="font-medium">₹{orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Delivery:</span>
                    <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total:</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Contributed:</span>
                      <span className="text-green-600">₹{groupCheckout.totalContributed.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={(groupCheckout.totalContributed / finalTotal) * 100} 
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Room Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{room.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {room.roomCode}
                      </Badge>
                      <span className="text-xs text-gray-500">Room Code</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Your Contribution</DialogTitle>
            <DialogDescription>
              Enter the amount you want to contribute towards this group order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contribution-amount">Contribution Amount</Label>
              <Input
                id="contribution-amount"
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Remaining: ₹{Math.max(0, finalTotal - groupCheckout.totalContributed).toFixed(2)}
              </p>
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={selectedPaymentMethod === 'wallet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className="justify-start gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  VyronaWallet
                </Button>
                <Button
                  variant={selectedPaymentMethod === 'upi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className="justify-start gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  UPI
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowContributionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContributionSubmit}
                disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
                className="flex-1"
              >
                Add Contribution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}