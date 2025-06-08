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
import { AlertCircle, BookOpen, Calendar, DollarSign, Package, RefreshCw, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import { useLocation } from "wouter";

export default function MyVyronaMart() {
  const [selectedReturnItem, setSelectedReturnItem] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
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
          <span>Loading your VyronaMart library...</span>
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
              My VyronaMart Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Manage your VyronaMart wallet, track book rentals, library loans, and purchases all in one place.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

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

        {/* Main Content Tabs */}
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
          <TabsContent value="books">
            <div className="space-y-6">
              {/* Active Rentals Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Active Book Rentals</span>
                  </CardTitle>
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

              {/* Library Loans Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <span>Library Borrowed Books</span>
                  </CardTitle>
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
            </div>
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
                              <h3 className="font-semibold text-lg">{purchase.productName || 'Unknown Product'}</h3>
                              <p className="text-sm text-gray-600">Order #{purchase.id}</p>
                              <Badge className="mt-2 bg-green-100 text-green-800">
                                Owned
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(purchase.totalAmount || 0)}</p>
                              <p className="text-sm text-gray-600">
                                Purchased: {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : 'N/A'}
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