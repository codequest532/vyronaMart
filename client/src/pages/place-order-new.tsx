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
  Clock,
  Target
} from "lucide-react";

// Interfaces
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
}

interface ItemContributor {
  userId: number;
  username: string;
  amount: number;
  paymentMethod: 'wallet' | 'googlepay' | 'phonepe' | 'cod';
  status: 'pending' | 'contributed' | 'confirmed';
  transactionId?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'wallet' | 'googlepay' | 'phonepe' | 'cod';
  icon: string;
  enabled: boolean;
  requiresFullPayment?: boolean;
  apiEndpoint?: string;
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
}

export default function PlaceOrderNew() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Payment method configurations
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'wallet',
      name: 'Vyrona Wallet',
      type: 'wallet',
      icon: 'Wallet',
      enabled: true,
      apiEndpoint: '/api/wallet/pay'
    },
    {
      id: 'googlepay',
      name: 'Google Pay Groups',
      type: 'googlepay',
      icon: 'Smartphone',
      enabled: true,
      apiEndpoint: '/api/payments/googlepay-groups'
    },
    {
      id: 'phonepe',
      name: 'PhonePe Split',
      type: 'phonepe',
      icon: 'Smartphone',
      enabled: true,
      apiEndpoint: '/api/payments/phonepe-split'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      type: 'cod',
      icon: 'Package',
      enabled: false, // Will be dynamically enabled based on conditions
      requiresFullPayment: true
    }
  ];

  // State management
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    items: [],
    contributionTargets: [],
    totalCartValue: 0,
    totalContributed: 0,
    allItemsFunded: false,
    canProceedToOrder: false,
    codEligible: false,
    deliveryAddress: null
  });

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState<Partial<DeliveryAddress>>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true
  });

  const roomId = params?.roomId ? parseInt(params.roomId) : null;

  // Fetch cart items for the room
  const { data: cartItemsResponse, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/room-cart", roomId],
    queryFn: () => fetch(`/api/room-cart/${roomId}`).then(res => res.json()),
    enabled: !!roomId,
  });

  // Fetch room details
  const { data: roomsResponse, isLoading: roomLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    queryFn: () => fetch("/api/shopping-rooms").then(res => res.json()),
  });

  // Fetch current user wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance/1"],
    queryFn: () => fetch("/api/wallet/balance/1").then(res => res.json()),
  });

  const cartItems = Array.isArray(cartItemsResponse) ? cartItemsResponse : [];
  const room = Array.isArray(roomsResponse) ? roomsResponse.find(r => r.id === roomId) : null;

  // Initialize contribution-based checkout system
  useEffect(() => {
    if (!cartItems.length || !room?.memberCount) return;
    
    // Convert cart items to contribution-trackable items
    const contributionItems: OrderItem[] = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      imageUrl: item.imageUrl,
      contributedAmount: 0,
      targetAmount: item.price * (item.quantity || 1),
      isFullyFunded: false,
      contributors: []
    }));

    // Create contribution targets for each item
    const targets: ContributionTarget[] = contributionItems.map(item => ({
      itemId: item.id,
      targetAmount: item.targetAmount,
      currentAmount: 0,
      remainingAmount: item.targetAmount,
      progress: 0,
      isComplete: false
    }));

    const totalCartValue = contributionItems.reduce((sum, item) => sum + item.targetAmount, 0);
    const codEligible = room.memberCount === 1;

    setCheckoutState({
      items: contributionItems,
      contributionTargets: targets,
      totalCartValue,
      totalContributed: 0,
      allItemsFunded: false,
      canProceedToOrder: false,
      codEligible,
      deliveryAddress: null
    });
  }, [cartItems, room?.memberCount]);

  // Contribution management
  const addContribution = async (itemId: number, amount: number, paymentMethod: PaymentMethod) => {
    try {
      const item = checkoutState.items.find(i => i.id === itemId);
      if (!item) return;

      const remainingAmount = item.targetAmount - item.contributedAmount;
      if (amount > remainingAmount) {
        toast({
          title: "Invalid Amount",
          description: `Maximum contribution for this item is ₹${remainingAmount.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }

      // Process payment based on method
      let transactionId = '';
      if (paymentMethod.type === 'wallet') {
        const walletBalance = walletData?.balance || 0;
        if (amount > walletBalance) {
          toast({
            title: "Insufficient Balance",
            description: "Please add money to your Vyrona Wallet first.",
            variant: "destructive",
          });
          return;
        }
        
        const response = await apiRequest('POST', paymentMethod.apiEndpoint!, { 
          amount, 
          itemId,
          roomId 
        });
        const responseData = await response.json();
        transactionId = responseData.transactionId;
      } else if (paymentMethod.type === 'googlepay') {
        const response = await apiRequest('POST', paymentMethod.apiEndpoint!, {
          amount,
          itemId,
          roomId,
          memberCount: room?.memberCount
        });
        const responseData = await response.json();
        transactionId = responseData.transactionId;
      } else if (paymentMethod.type === 'phonepe') {
        const response = await apiRequest('POST', paymentMethod.apiEndpoint!, {
          amount,
          itemId,
          roomId,
          memberCount: room?.memberCount
        });
        const responseData = await response.json();
        transactionId = responseData.transactionId;
      } else if (paymentMethod.type === 'cod') {
        if (amount !== checkoutState.totalCartValue) {
          toast({
            title: "COD Requires Full Payment",
            description: "Cash on Delivery requires one person to pay the entire cart amount.",
            variant: "destructive",
          });
          return;
        }
        transactionId = `cod_${Date.now()}`;
      }

      const newContributor: ItemContributor = {
        userId: 1,
        username: 'You',
        amount,
        paymentMethod: paymentMethod.type,
        status: 'contributed',
        transactionId
      };

      setCheckoutState(prev => {
        const updatedItems = prev.items.map(item => 
          item.id === itemId 
            ? {
                ...item,
                contributedAmount: item.contributedAmount + amount,
                contributors: [...item.contributors, newContributor],
                isFullyFunded: (item.contributedAmount + amount) >= item.targetAmount
              }
            : item
        );

        const updatedTargets = prev.contributionTargets.map(target =>
          target.itemId === itemId
            ? {
                ...target,
                currentAmount: target.currentAmount + amount,
                remainingAmount: target.remainingAmount - amount,
                progress: ((target.currentAmount + amount) / target.targetAmount) * 100,
                isComplete: (target.currentAmount + amount) >= target.targetAmount
              }
            : target
        );

        const totalContributed = updatedItems.reduce((sum, item) => sum + item.contributedAmount, 0);
        const allItemsFunded = updatedItems.every(item => item.isFullyFunded);
        const canProceedToOrder = allItemsFunded;

        return {
          ...prev,
          items: updatedItems,
          contributionTargets: updatedTargets,
          totalContributed,
          allItemsFunded,
          canProceedToOrder
        };
      });

      toast({
        title: "Contribution Added",
        description: `₹${amount} contributed via ${paymentMethod.name}`,
      });

      setShowContributionModal(false);
      setContributionAmount('');

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process contribution",
        variant: "destructive",
      });
    }
  };

  const handleContributeClick = (item: OrderItem) => {
    setSelectedItem(item);
    setShowContributionModal(true);
  };

  const handleContributionSubmit = () => {
    const amount = parseFloat(contributionAmount);
    if (amount > 0 && selectedItem && selectedPaymentMethod) {
      addContribution(selectedItem.id, amount, selectedPaymentMethod);
    }
  };

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/group-orders/place", {
        roomId,
        items: checkoutState.items,
        totalAmount: checkoutState.totalCartValue
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully",
        description: "Your group order has been placed successfully.",
      });
      setLocation("/social");
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    }
  });

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
                <h1 className="text-2xl font-bold">Contribution-Based Checkout</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {room.name} • {room.memberCount} members • Contribute to place order
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Room: {room.roomCode}
              </Badge>
              {checkoutState.allItemsFunded ? (
                <Badge variant="default" className="bg-green-600 text-white">
                  Ready to Order
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Funding Required
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items & Contributions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Contribution Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Total Contributed</span>
                    <span className="font-medium">₹{checkoutState.totalContributed.toFixed(2)} / ₹{checkoutState.totalCartValue.toFixed(2)}</span>
                  </div>
                  <Progress 
                    value={(checkoutState.totalContributed / checkoutState.totalCartValue) * 100} 
                    className="h-3"
                  />
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium text-blue-600">Items</div>
                      <div>{checkoutState.items.length}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-600">Funded</div>
                      <div>{checkoutState.items.filter(item => item.isFullyFunded).length}</div>
                    </div>
                    <div>
                      <div className="font-medium text-orange-600">Remaining</div>
                      <div>₹{(checkoutState.totalCartValue - checkoutState.totalContributed).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Items Requiring Contribution</h2>
              {checkoutState.items.map((item) => {
                const target = checkoutState.contributionTargets.find(t => t.itemId === item.id);
                return (
                  <Card key={item.id} className={`${item.isFullyFunded ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-orange-500'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Quantity: {item.quantity} • Target: ₹{item.targetAmount.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              {item.isFullyFunded ? (
                                <Badge variant="default" className="bg-green-600 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fully Funded
                                </Badge>
                              ) : (
                                <Button
                                  onClick={() => handleContributeClick(item)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Contribute
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Contribution Progress */}
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Contributed: ₹{item.contributedAmount.toFixed(2)}</span>
                              <span>Remaining: ₹{(item.targetAmount - item.contributedAmount).toFixed(2)}</span>
                            </div>
                            <Progress 
                              value={target?.progress || 0} 
                              className="h-2"
                            />
                          </div>

                          {/* Contributors List */}
                          {item.contributors.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Contributors:</h4>
                              <div className="space-y-1">
                                {item.contributors.map((contributor, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded">
                                    <span className="flex items-center gap-2">
                                      <Users className="h-3 w-3" />
                                      {contributor.username}
                                    </span>
                                    <span className="flex items-center gap-2">
                                      ₹{contributor.amount.toFixed(2)}
                                      <Badge variant="outline" className="text-xs">
                                        {contributor.paymentMethod}
                                      </Badge>
                                    </span>
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
          </div>

          {/* Order Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Items Total</span>
                    <span>₹{checkoutState.totalCartValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Contributed</span>
                    <span className="text-green-600">₹{checkoutState.totalContributed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining</span>
                    <span className="text-orange-600">₹{(checkoutState.totalCartValue - checkoutState.totalContributed).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Order Total</span>
                    <span>₹{checkoutState.totalCartValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order */}
            <Card>
              <CardContent className="p-6">
                <Button
                  onClick={() => placeOrderMutation.mutate()}
                  disabled={!checkoutState.canProceedToOrder || placeOrderMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {placeOrderMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : checkoutState.canProceedToOrder ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Complete Funding Required
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                  All items must be fully funded to place order
                </p>
              </CardContent>
            </Card>

            {/* Wallet Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{walletData?.balance?.toFixed(2) || '0.00'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contribute to Item</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  Contributing to: <strong>{selectedItem.name}</strong><br />
                  Remaining amount: <strong>₹{(selectedItem.targetAmount - selectedItem.contributedAmount).toFixed(2)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Contribution Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                max={selectedItem ? selectedItem.targetAmount - selectedItem.contributedAmount : 0}
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethods.filter(method => method.enabled || (method.type === 'cod' && checkoutState.codEligible)).map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedPaymentMethod?.id === method.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {method.icon === 'Wallet' && <Wallet className="h-4 w-4 mr-2" />}
                    {method.icon === 'Smartphone' && <Smartphone className="h-4 w-4 mr-2" />}
                    {method.icon === 'Package' && <Package className="h-4 w-4 mr-2" />}
                    {method.name}
                  </Button>
                ))}
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
                disabled={!contributionAmount || !selectedPaymentMethod}
                className="flex-1"
              >
                Contribute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}