import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BookOpen, Calendar, DollarSign, Package, RefreshCw, Clock, CheckCircle, XCircle, Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import { useLocation } from "wouter";

export default function MyVyrona() {
  const [selectedReturnItem, setSelectedReturnItem] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get current user from localStorage or context
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"id": 1}');

  // Fetch user's rental history
  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: [`/api/rentals/user/${currentUser.id}`],
    enabled: !!currentUser.id
  });

  // Fetch user's borrowed books (loans)
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: [`/api/book-loans/user/${currentUser.id}`],
    enabled: !!currentUser.id
  });

  // Fetch user's purchased books
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: [`/api/orders/user/${currentUser.id}`],
    enabled: !!currentUser.id
  });

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: [`/api/wallet/balance/${currentUser.id}`],
    enabled: !!currentUser.id
  });

  // Fetch wallet transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/wallet/transactions/${currentUser.id}`],
    enabled: !!currentUser.id
  });

  // Add money to wallet mutation
  const addMoneyMutation = useMutation({
    mutationFn: async (amount: number) => {
      // Create Razorpay order
      const orderResponse = await fetch("/api/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userId: currentUser.id })
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Create Razorpay payment
      return new Promise((resolve, reject) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "VyronaMart",
          description: "Wallet Top-up",
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch("/api/wallet/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: currentUser.id,
                  amount
                })
              });

              if (!verifyResponse.ok) {
                throw new Error("Payment verification failed");
              }

              const result = await verifyResponse.json();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          prefill: {
            name: currentUser.username || "User",
            email: currentUser.email || "user@example.com"
          },
          theme: {
            color: "#3B82F6"
          }
        };

        // Load Razorpay script if not already loaded
        if (typeof (window as any).Razorpay === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          };
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        } else {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Money added to wallet successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/balance/${currentUser.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/transactions/${currentUser.id}`] });
      setAddMoneyAmount("");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to add money to wallet";
      let description = errorMessage;
      
      // Check for payment gateway configuration error
      if (error.code === "PAYMENT_GATEWAY_NOT_CONFIGURED" || errorMessage.includes("Payment gateway not configured")) {
        description = "Payment service is currently unavailable. Please try again later or contact support.";
      }
      
      toast({
        title: "Payment Failed",
        description,
        variant: "destructive",
      });
    }
  });

  // Create return request mutation
  const createReturnRequest = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await fetch("/api/returns/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error("Failed to create return request");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Request Submitted",
        description: "Your return request has been sent to the seller/admin for processing."
      });
      setIsReturnDialogOpen(false);
      setReturnReason("");
      setSelectedReturnItem(null);
      queryClient.invalidateQueries({ queryKey: [`/api/rentals/user/${currentUser.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit return request. Please try again."
      });
    }
  });

  const handleReturnRequest = () => {
    if (!selectedReturnItem || !returnReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the return."
      });
      return;
    }

    const requestData = {
      userId: currentUser.id,
      rentalId: selectedReturnItem.type === 'rental' ? selectedReturnItem.id : null,
      loanId: selectedReturnItem.type === 'loan' ? selectedReturnItem.id : null,
      bookType: selectedReturnItem.type,
      bookTitle: selectedReturnItem.productName || selectedReturnItem.bookTitle,
      returnReason,
      sellerId: selectedReturnItem.sellerId || null,
      libraryId: selectedReturnItem.libraryId || null
    };

    createReturnRequest.mutate(requestData);
  };

  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (rentalsLoading || loansLoading || purchasesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading your VyronaRead library...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
              className="mr-4 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              MyVyrona Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Manage your VyronaWallet, track book rentals, library loans, and purchases all in one place.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {walletLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                    ) : (
                      `₹${walletData?.balance?.toFixed(2) || "0.00"}`
                    )}
                  </p>
                  <p className="text-sm text-green-600">Wallet Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{rentals.length}</p>
                  <p className="text-sm text-gray-600">Active Rentals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{loans.length}</p>
                  <p className="text-sm text-gray-600">Library Loans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{purchases.length}</p>
                  <p className="text-sm text-gray-600">Purchased Books</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile & Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Wallet className="h-5 w-5" />
                  <span>VyronaWallet</span>
                </CardTitle>
                <CardDescription className="text-green-600">
                  Manage your wallet and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {walletLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-24 mx-auto rounded"></div>
                      ) : (
                        `₹${walletData?.balance?.toFixed(2) || "0.00"}`
                      )}
                    </div>
                    <p className="text-green-600 text-sm">Available Balance</p>
                  </div>

                  {/* Add Money Button */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Money
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Money to VyronaWallet</DialogTitle>
                        <DialogDescription>
                          Enter the amount you want to add to your wallet
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={addMoneyAmount}
                            onChange={(e) => setAddMoneyAmount(e.target.value)}
                            min="1"
                            max="10000"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setAddMoneyAmount("100")}
                          >
                            ₹100
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setAddMoneyAmount("500")}
                          >
                            ₹500
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setAddMoneyAmount("1000")}
                          >
                            ₹1000
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          className="w-full"
                          disabled={!addMoneyAmount || parseFloat(addMoneyAmount) <= 0 || addMoneyMutation.isPending}
                          onClick={() => addMoneyMutation.mutate(parseFloat(addMoneyAmount))}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {addMoneyMutation.isPending ? "Processing..." : `Pay ₹${addMoneyAmount || "0"}`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Transaction History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Recent Transactions</span>
                </CardTitle>
                <CardDescription>
                  Your latest wallet activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Add money to start using your wallet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {transaction.type === 'credit' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {formatDistance(new Date(transaction.createdAt), new Date(), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs - Only Book Management */}
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="books" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Book Management</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Purchase History</span>
            </TabsTrigger>
          </TabsList>

          {/* Book Management Tab */}
          <TabsContent value="books" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Rentals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Active Rentals</span>
                  </CardTitle>
                  <CardDescription>
                    Books you're currently renting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rentals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active rentals</p>
                      <p className="text-sm">Visit VyronaRead to rent books</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rentals.map((rental: any) => (
                        <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-16 bg-blue-100 rounded flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{rental.bookTitle}</h4>
                              <p className="text-sm text-gray-600">Due: {rental.dueDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedReturnItem(rental)}
                                >
                                  Return Book
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Return Book Request</DialogTitle>
                                  <DialogDescription>
                                    Request to return "{selectedReturnItem?.bookTitle}"
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason">Reason for return (optional)</Label>
                                    <Input
                                      id="reason"
                                      placeholder="Enter reason"
                                      value={returnReason}
                                      onChange={(e) => setReturnReason(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() => {
                                      toast({
                                        title: "Return request submitted",
                                        description: "Your return request has been sent to the seller",
                                      });
                                      setReturnReason("");
                                      setSelectedReturnItem(null);
                                    }}
                                  >
                                    Submit Request
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Library Loans */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span>Library Loans</span>
                  </CardTitle>
                  <CardDescription>
                    Books borrowed from libraries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active loans</p>
                      <p className="text-sm">Visit VyronaRead to borrow from libraries</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loans.map((loan: any) => (
                        <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-16 bg-purple-100 rounded flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{loan.bookTitle}</h4>
                              <p className="text-sm text-gray-600">Library: {loan.libraryName}</p>
                              <p className="text-sm text-gray-600">Due: {loan.dueDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Purchase History Tab */}
          <TabsContent value="purchases" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Purchase History</span>
                </CardTitle>
                <CardDescription>
                  Your order history from VyronaMart
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No purchases yet</p>
                    <p className="text-sm">Start shopping on VyronaMart</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Order #{order.id}</h4>
                            <p className="text-sm text-gray-600">₹{order.totalAmount}</p>
                            <p className="text-sm text-gray-600">
                              {formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}