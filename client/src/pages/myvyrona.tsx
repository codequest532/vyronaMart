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
import { AlertCircle, BookOpen, Calendar, DollarSign, Package, RefreshCw, Clock, CheckCircle, XCircle, Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";

export default function MyVyrona() {
  const [selectedReturnItem, setSelectedReturnItem] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to add money to wallet",
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Book Rental Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your book library - track rentals, borrowed books, and purchased items all in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <Package className="h-8 w-8 text-green-600" />
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
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{purchases.length}</p>
                  <p className="text-sm text-gray-600">Purchased Books</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(rentals.reduce((sum, rental) => sum + (rental.totalAmountPaid || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallet" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>VyronaWallet</span>
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Active Rentals</span>
            </TabsTrigger>
            <TabsTrigger value="loans" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Library Loans</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Purchased Books</span>
            </TabsTrigger>
          </TabsList>

          {/* VyronaWallet Tab */}
          <TabsContent value="wallet">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wallet Balance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <span>Wallet Balance</span>
                  </CardTitle>
                  <CardDescription>
                    Your VyronaWallet balance for VyronaMart purchases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {walletLoading ? (
                        <div className="animate-pulse bg-gray-200 h-12 w-32 mx-auto rounded"></div>
                      ) : (
                        `₹${walletData?.balance?.toFixed(2) || "0.00"}`
                      )}
                    </div>
                    <p className="text-gray-600 mb-6">Available Balance</p>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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
                            disabled={!addMoneyAmount || parseFloat(addMoneyAmount) <= 0}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay ₹{addMoneyAmount || "0"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Manage your wallet and view transaction history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Send Money
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Request Money
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Transaction History
                  </Button>
                  <Separator />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Wallet Features:</p>
                    <ul className="space-y-1">
                      <li>• Instant payments on VyronaMart</li>
                      <li>• Secure transactions with bank-level encryption</li>
                      <li>• Real-time balance updates</li>
                      <li>• Transaction history and receipts</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Your wallet transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Your wallet transactions will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Rentals Tab */}
          <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <CardTitle>Active Book Rentals</CardTitle>
                <CardDescription>
                  Manage your rented books with 15-day billing cycles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rentals.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active rentals found</p>
                    <p className="text-sm text-gray-500">Start renting books from VyronaRead</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentals.map((rental: any) => (
                      <Card key={rental.id} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex space-x-4">
                              {rental.productImage && (
                                <img
                                  src={rental.productImage}
                                  alt={rental.productName}
                                  className="w-16 h-20 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{rental.productName}</h3>
                                <p className="text-sm text-gray-600">by {rental.sellerName}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <Badge className={getStatusColor(rental.status)}>
                                    {rental.status}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    Cycle {rental.currentBillingCycle}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="text-sm text-gray-600">
                                Next billing: {formatDistance(new Date(rental.nextBillingDate), new Date(), { addSuffix: true })}
                              </p>
                              <p className="font-semibold">
                                {formatPrice(rental.rentalPricePerCycle)}/cycle
                              </p>
                              <p className="text-sm text-gray-600">
                                Total paid: {formatPrice(rental.totalAmountPaid)}
                              </p>
                              {rental.status === 'active' && !rental.returnRequestId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReturnItem({ ...rental, type: 'rental' });
                                    setIsReturnDialogOpen(true);
                                  }}
                                >
                                  Request Return
                                </Button>
                              )}
                              {rental.returnRequestId && (
                                <Badge variant="secondary">Return Requested</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Loans Tab */}
          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Library Borrowed Books</CardTitle>
                <CardDescription>
                  Track your borrowed books from integrated libraries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loans.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No borrowed books found</p>
                    <p className="text-sm text-gray-500">Borrow books from integrated libraries</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loans.map((loan: any) => (
                      <Card key={loan.id} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{loan.bookTitle}</h3>
                              <p className="text-sm text-gray-600">from {loan.libraryName}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <Badge className={getStatusColor(loan.status)}>
                                  {loan.status}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  Due: {new Date(loan.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 mb-2">
                                Borrowed: {formatDistance(new Date(loan.loanDate), new Date(), { addSuffix: true })}
                              </p>
                              {loan.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReturnItem({ ...loan, type: 'loan' });
                                    setIsReturnDialogOpen(true);
                                  }}
                                >
                                  Request Return
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchased Books Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Purchased Books</CardTitle>
                <CardDescription>
                  Your permanent book collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No purchased books found</p>
                    <p className="text-sm text-gray-500">Buy books to build your permanent collection</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase: any) => (
                      <Card key={purchase.id} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{purchase.productName}</h3>
                              <p className="text-sm text-gray-600">Order #{purchase.id}</p>
                              <Badge className="mt-2 bg-green-100 text-green-800">
                                Owned
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(purchase.totalAmount)}</p>
                              <p className="text-sm text-gray-600">
                                Purchased: {new Date(purchase.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Return Request Dialog */}
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Book Return</DialogTitle>
              <DialogDescription>
                Submit a return request for "{selectedReturnItem?.productName || selectedReturnItem?.bookTitle}"
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="return-reason">Reason for Return</Label>
                <Textarea
                  id="return-reason"
                  placeholder="Please provide a reason for returning this book..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReturnDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReturnRequest}
                disabled={createReturnRequest.isPending || !returnReason.trim()}
              >
                {createReturnRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}