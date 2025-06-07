import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  CreditCard, 
  Smartphone, 
  ArrowLeft,
  CheckCircle,
  Users,
  Package,
  MapPin,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  AlertCircle,
  Check
} from "lucide-react";

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
  const [match, params] = useRoute("/place-order/:roomId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Fetch room details
  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["/api/social/groups", roomId],
    queryFn: () => fetch(`/api/social/groups/${roomId}`).then(res => res.json()),
    enabled: !!roomId
  });

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

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/social")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Place Order</h1>
          <p className="text-muted-foreground">Complete your group purchase with delivery addresses</p>
        </div>
      </div>

      {/* Room Info */}
      {room && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {room.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">{room.memberCount} members</Badge>
              <span>•</span>
              <span>Room ID: {roomId}</span>
              <span>•</span>
              <span>Delivery Mode: {deliveryMode.type === 'single' ? 'Single Address' : 'Multiple Addresses'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-based Checkout */}
      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="address" className="gap-2">
            <MapPin className="h-4 w-4" />
            Delivery Address
          </TabsTrigger>
          <TabsTrigger value="payment" disabled={!canProceedToPayment()}>
            <Wallet className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!canProceedToPayment()}>
            <Package className="h-4 w-4" />
            Review Order
          </TabsTrigger>
        </TabsList>

        {/* Address Step */}
        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Addresses
                <Badge variant="secondary">
                  {deliveryMode.addresses.length} {deliveryMode.addresses.length === 1 ? 'Address' : 'Addresses'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Delivery Option */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
                <Checkbox
                  id="single-delivery"
                  checked={deliveryMode.useSingleAddress}
                  onCheckedChange={toggleSingleDelivery}
                />
                <Label htmlFor="single-delivery" className="text-sm font-medium">
                  Use single delivery address for all members
                </Label>
              </div>
              
              {/* Show addresses based on delivery mode */}
              {deliveryMode.useSingleAddress ? (
                // Single address form
                deliveryMode.addresses.slice(0, 1).map((address, index) => (
                  <div key={address.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address for All Members
                        <Badge variant="outline">Shared</Badge>
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`fullName-${address.id}`}>Full Name *</Label>
                        <Input
                          id={`fullName-${address.id}`}
                          placeholder="Enter full name"
                          value={address.fullName}
                          onChange={(e) => updateAddress(address.id, 'fullName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${address.id}`}>Phone Number *</Label>
                        <Input
                          id={`phone-${address.id}`}
                          placeholder="Enter phone number"
                          value={address.phone}
                          onChange={(e) => updateAddress(address.id, 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`addressLine1-${address.id}`}>Address Line 1 *</Label>
                      <Input
                        id={`addressLine1-${address.id}`}
                        placeholder="House no, Building name, Street"
                        value={address.addressLine1}
                        onChange={(e) => updateAddress(address.id, 'addressLine1', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`addressLine2-${address.id}`}>Address Line 2</Label>
                      <Input
                        id={`addressLine2-${address.id}`}
                        placeholder="Area, Locality"
                        value={address.addressLine2 || ''}
                        onChange={(e) => updateAddress(address.id, 'addressLine2', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`city-${address.id}`}>City *</Label>
                        <Input
                          id={`city-${address.id}`}
                          placeholder="Enter city"
                          value={address.city}
                          onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`state-${address.id}`}>State *</Label>
                        <Input
                          id={`state-${address.id}`}
                          placeholder="Enter state"
                          value={address.state}
                          onChange={(e) => updateAddress(address.id, 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`pincode-${address.id}`}>Pincode *</Label>
                        <Input
                          id={`pincode-${address.id}`}
                          placeholder="Enter pincode"
                          value={address.pincode}
                          onChange={(e) => updateAddress(address.id, 'pincode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Multiple addresses - one per member
                deliveryMode.addresses.map((address, index) => (
                <div key={address.id} className={`border rounded-lg p-4 space-y-4 ${
                  address.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {address.memberName}
                      {address.isDefault && <Badge variant="default">Required</Badge>}
                      {!address.isDefault && <Badge variant="outline">Optional</Badge>}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`fullName-${address.id}`}>
                        Full Name {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`fullName-${address.id}`}
                        placeholder="Enter full name"
                        value={address.fullName}
                        onChange={(e) => updateAddress(address.id, 'fullName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`phone-${address.id}`}>
                        Phone Number {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`phone-${address.id}`}
                        placeholder="Enter phone number"
                        value={address.phone}
                        onChange={(e) => updateAddress(address.id, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`addressLine1-${address.id}`}>
                      Address Line 1 {address.isDefault ? '*' : ''}
                    </Label>
                    <Input
                      id={`addressLine1-${address.id}`}
                      placeholder="House no, Building name, Street"
                      value={address.addressLine1}
                      onChange={(e) => updateAddress(address.id, 'addressLine1', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`addressLine2-${address.id}`}>Address Line 2</Label>
                    <Input
                      id={`addressLine2-${address.id}`}
                      placeholder="Area, Locality"
                      value={address.addressLine2 || ''}
                      onChange={(e) => updateAddress(address.id, 'addressLine2', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`city-${address.id}`}>
                        City {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`city-${address.id}`}
                        placeholder="Enter city"
                        value={address.city}
                        onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`state-${address.id}`}>
                        State {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`state-${address.id}`}
                        placeholder="Enter state"
                        value={address.state}
                        onChange={(e) => updateAddress(address.id, 'state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`pincode-${address.id}`}>
                        Pincode {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`pincode-${address.id}`}
                        placeholder="Enter pincode"
                        value={address.pincode}
                        onChange={(e) => updateAddress(address.id, 'pincode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                ))
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep('payment')} 
                  disabled={!canProceedToPayment()}
                  className="gap-2"
                >
                  Continue to Payment
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Step */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Group Payment Notice */}
              {room?.memberCount > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Group Payment</h4>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This room has {room.memberCount} members. Group contributions are available with VyronaWallet and UPI only.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPayment === "wallet" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setSelectedPayment("wallet")}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        VyronaWallet
                        {room?.memberCount > 1 && <Badge variant="secondary" className="text-xs">Group Compatible</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Balance: ₹{walletData?.balance?.toFixed(2) || "0.00"}
                        {room?.memberCount > 1 && " • Supports member contributions"}
                      </p>
                    </div>
                    {selectedPayment === "wallet" && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 transition-colors ${
                    room?.memberCount > 1 
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60" 
                      : selectedPayment === "card" 
                        ? "border-primary bg-primary/5 cursor-pointer" 
                        : "border-border cursor-pointer"
                  }`}
                  onClick={() => room?.memberCount === 1 && setSelectedPayment("card")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        Credit/Debit Card
                        {room?.memberCount > 1 && <Badge variant="destructive" className="text-xs">Not Available</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {room?.memberCount > 1 
                          ? "Not available for group payments" 
                          : "Visa, MasterCard, RuPay"
                        }
                      </p>
                    </div>
                    {selectedPayment === "card" && room?.memberCount === 1 && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPayment === "upi" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setSelectedPayment("upi")}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        UPI
                        {room?.memberCount > 1 && <Badge variant="secondary" className="text-xs">Group Compatible</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Pay using your UPI app
                        {room?.memberCount > 1 && " • Supports member contributions"}
                      </p>
                    </div>
                    {selectedPayment === "upi" && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              </div>

              {/* Group Checkout Section */}
              {room?.memberCount > 1 && (selectedPayment === "wallet" || selectedPayment === "upi") && (
                <div className="mt-6 p-6 border rounded-lg bg-white shadow-sm">
                  <h3 className="text-xl font-semibold mb-6 text-center">Group Checkout</h3>
                  
                  {/* Pricing Summary */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Product Total:</span>
                      <span className="font-medium">₹{orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Group Discount:</span>
                      <span className="font-medium">-₹{(orderTotal * 0.15).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Required Amount:</span>
                      <span>₹{(orderTotal * 0.85).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Collection Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Collected:</span>
                      <span className="text-green-600 font-bold text-lg">₹{(orderTotal * 0.85 * 0.73).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div className="bg-green-500 h-3 rounded-full transition-all duration-300" style={{ width: '73%' }}></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>73% funded</span>
                      <span>₹{(orderTotal * 0.85 * 0.27).toFixed(2)} remaining</span>
                    </div>
                  </div>

                  {/* Member Contributions */}
                  <div className="mb-6">
                    <p className="font-medium mb-3">Member Contributions:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded">
                        <span>You (35%)</span>
                        <span className="text-green-600 font-semibold">₹{(orderTotal * 0.85 * 0.35).toFixed(2)} ✓</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded">
                        <span>Alice (25%)</span>
                        <span className="text-green-600 font-semibold">₹{(orderTotal * 0.85 * 0.25).toFixed(2)} ✓</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded">
                        <span>Bob (20%)</span>
                        <span className="text-orange-600 font-semibold">₹{(orderTotal * 0.85 * 0.20).toFixed(2)} pending</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span>Carol (20%)</span>
                        <span className="text-gray-500">₹{(orderTotal * 0.85 * 0.20).toFixed(2)} not set</span>
                      </div>
                    </div>
                  </div>

                  {/* VyronaWallet Balance */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-6 w-6 text-blue-600" />
                      <span className="font-semibold text-blue-900">VyronaWallet</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">₹{walletData?.balance?.toFixed(2) || "0.00"}</span>
                  </div>

                  {/* Add Contribution Button */}
                  <Button 
                    className="w-full h-12 text-lg font-semibold mb-4"
                    onClick={() => setShowContributionModal(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your Contribution
                  </Button>

                  {/* Place Group Order Button */}
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-lg font-semibold bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Place Group Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentStep('address')}>
              Back to Address
            </Button>
            <Button onClick={() => setCurrentStep('review')} className="gap-2">
              Review Order
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </TabsContent>

        {/* Review Step */}
        <TabsContent value="review" className="space-y-4">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground">No items in cart</p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee ({deliveryMode.addresses.length} {deliveryMode.addresses.length === 1 ? 'address' : 'addresses'}):</span>
                      <span>₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveryMode.addresses.filter(addr => 
                  addr.fullName && addr.phone && addr.addressLine1 && addr.city && addr.state && addr.pincode
                ).map((address) => (
                  <div key={address.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{address.memberName}</span>
                      {address.isDefault && <Badge variant="outline">Primary</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{address.fullName} • {address.phone}</p>
                      <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Final Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('payment')}>
                  Back to Payment
                </Button>
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={cartItems.length === 0 || isProcessing || !validateAddresses()}
                  size="lg"
                  className="gap-2"
                >
                  {isProcessing ? "Processing..." : `Place Order - ₹${finalTotal.toFixed(2)}`}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contribution Modal */}
      <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Your Contribution</DialogTitle>
            <DialogDescription>
              Contribute any amount to the group order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contribution">Contribution Amount (₹)</Label>
              <Input
                id="contribution"
                type="number"
                placeholder="Enter amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                min="1"
                step="0.01"
                className="text-lg h-12"
              />
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
              <div className="grid grid-cols-1 gap-3">
                {/* UPI Option */}
                <div 
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    contributionPaymentMethod === "upi" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setContributionPaymentMethod("upi")}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">UPI Payment</p>
                      <p className="text-sm text-gray-600">Pay directly via UPI</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Instant
                  </Badge>
                </div>

                {/* Card Option */}
                <div 
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    contributionPaymentMethod === "card" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setContributionPaymentMethod("card")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Secure card payment</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Secure
                  </Badge>
                </div>
              </div>
            </div>

            {/* Current VyronaWallet Balance Display */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Current VyronaWallet Balance</span>
              </div>
              <span className="text-lg font-bold text-blue-600">₹{walletData?.balance?.toFixed(2) || "0.00"}</span>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowContributionModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={async () => {
                  if (contributionAmount && parseFloat(contributionAmount) > 0) {
                    try {
                      await apiRequest("POST", "/api/wallet/contribute", {
                        roomId: roomId,
                        amount: parseFloat(contributionAmount),
                        userId: 1,
                        paymentMethod: contributionPaymentMethod
                      });
                      
                      toast({
                        title: "Contribution Added",
                        description: `₹${contributionAmount} has been contributed via ${contributionPaymentMethod === 'upi' ? 'UPI' : 'Card'}.`,
                      });
                      
                      setContributionAmount('');
                      setShowContributionModal(false);
                      
                      // Refresh wallet balance
                      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1"] });
                    } catch (error: any) {
                      toast({
                        title: "Contribution Failed",
                        description: error.message || "Failed to add contribution. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
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