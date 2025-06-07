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

  // Fetch user's purchased books - FIXED: properly alias as purchases
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

        {/* Purchase History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
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
      </div>
    </div>
  );
}