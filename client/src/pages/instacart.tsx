import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2,
  CreditCard,
  Truck,
  Shield,
  Tag,
  Percent,
  Heart,
  Star,
  Users,
  Gift,
  Instagram,
  Package,
  MessageCircle
} from "lucide-react";

export default function InstaCart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Fetch Instagram cart items from server
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/instacart"],
    retry: false,
  });

  // Mutations for Instagram cart operations
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return apiRequest("PUT", `/api/instacart/${productId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
      toast({
        title: "Cart Updated",
        description: "Product quantity updated successfully",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("DELETE", `/api/instacart/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
      toast({
        title: "Item Removed",
        description: "Product removed from cart",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/instacart/clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
      toast({
        title: "Cart Cleared",
        description: "All items removed from cart",
      });
    },
  });

  const applyPromoMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/instacart/promo", { code });
    },
    onSuccess: (data) => {
      setAppliedPromo(promoCode);
      setDiscount(data.discount || 0);
      toast({
        title: "Promo Applied",
        description: `${data.discount}% discount applied!`,
      });
    },
    onError: () => {
      toast({
        title: "Invalid Promo Code",
        description: "Please check your promo code and try again",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const subtotal = items.reduce((total: number, item: any) => 
    total + (item.price * item.quantity), 0
  );
  const shipping = subtotal > 500 ? 0 : 50;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping - discountAmount;

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: number) => {
    removeItemMutation.mutate(productId);
  };

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      applyPromoMutation.mutate(promoCode);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add some products to your cart first",
        variant: "destructive",
      });
      return;
    }

    const checkoutData = {
      items: items.map((item: any) => ({
        id: item.productId,
        name: item.productName || item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.imageUrl,
        seller: item.seller
      })),
      subtotal,
      shipping,
      discount: discountAmount,
      total,
      source: 'instagram'
    };

    setLocation(`/instagram-checkout?data=${encodeURIComponent(JSON.stringify(checkoutData))}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Instagram cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/instashop')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Instagram Shop
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Instagram className="text-white h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Instagram Cart</h1>
                  <p className="text-gray-600">Your Instagram shopping cart</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          // Empty cart state
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Instagram cart is empty</h2>
              <p className="text-gray-600 mb-8">
                Discover amazing products from verified Instagram sellers
              </p>
              <Button 
                size="lg" 
                onClick={() => setLocation('/instashop')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Instagram className="h-5 w-5 mr-2" />
                Shop Instagram Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Instagram className="h-5 w-5 text-purple-600" />
                    <span>Instagram Products</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.productName || item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.productName || item.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Instagram className="h-3 w-3 text-purple-600" />
                          <span className="text-sm text-purple-600">{item.seller}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="font-bold text-gray-900">₹{item.price}</span>
                          <Badge variant="secondary" className="text-xs">
                            Instagram Store
                          </Badge>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          disabled={updateQuantityMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={removeItemMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    <span>Promo Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={appliedPromo !== null}
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || appliedPromo !== null || applyPromoMutation.isPending}
                      size="sm"
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedPromo && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Percent className="h-4 w-4" />
                      <span className="text-sm">Promo "{appliedPromo}" applied!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{Math.round(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{Math.round(discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{Math.round(total)}</span>
                  </div>
                  
                  {shipping > 0 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <Truck className="h-4 w-4 inline mr-2" />
                      Add ₹{Math.round(500 - subtotal} more for free shipping
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Secure checkout with VyronaMart
                  </div>
                </CardContent>
              </Card>

              {/* Instagram Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    <span>Instagram Shopping</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Verified Instagram sellers</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span>Direct seller communication</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Authentic products only</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}