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
  Gift
} from "lucide-react";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Fetch cart items from server
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    retry: false,
  });

  // Mutations for cart operations
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return apiRequest("PUT", `/api/cart/${productId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart Updated",
        description: "Item quantity has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("DELETE", `/api/cart/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getTotalItems = () => items.length;
  const getTotalPrice = () => items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);

  const promoCodes = {
    "SAVE10": 10,
    "WELCOME20": 20,
    "GROUPBUY15": 15
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    if (promoCodes[code as keyof typeof promoCodes]) {
      const discountPercent = promoCodes[code as keyof typeof promoCodes];
      setAppliedPromo(code);
      setDiscount(discountPercent);
      toast({
        title: "Promo Code Applied!",
        description: `${discountPercent}% discount applied to your order.`,
      });
      setPromoCode("");
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "Please enter a valid promo code.",
        variant: "destructive",
      });
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setDiscount(0);
    toast({
      title: "Promo Code Removed",
      description: "Discount has been removed from your order.",
    });
  };

  const subtotal = getTotalPrice();
  const discountAmount = (subtotal * discount) / 100;
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal - discountAmount + shipping;

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the complete VyronaHub checkout flow
    setLocation("/vyronahub-checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl shadow-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              Shopping Cart
            </h1>
            <Button
              variant="outline"
              onClick={() => setLocation("/vyronahub")}
              className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </div>

          <Card className="max-w-lg mx-auto text-center bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl">
            <CardContent className="p-12">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-16 w-16 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Discover amazing products and start your shopping journey
              </p>
              <Button 
                onClick={() => setLocation("/vyronahub")} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 text-lg"
                size="lg"
              >
                <Gift className="h-5 w-5 mr-2" />
                Start Shopping
              </Button>
              
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-purple-100">
                <div className="text-center">
                  <div className="bg-purple-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Free Shipping</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Secure Payment</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-lg p-3 mb-2 mx-auto w-fit">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Group Buying</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl shadow-lg">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            Shopping Cart ({getTotalItems()} items)
          </h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/vyronahub")}
            className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-blue-200/30"></div>
                      <ShoppingCart className="h-10 w-10 text-purple-600 relative z-10" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-gray-600 mb-3 capitalize">{item.category}</p>
                      
                      <div className="flex items-center gap-3 mb-3">
                        {item.isGroupBuy && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <Users className="h-3 w-3 mr-1" />
                            Group Buy - {item.groupBuyDiscount}% OFF
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-sm text-gray-500 ml-1">(4.8)</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          ₹{Math.round(item.discountedPrice || item.price)}
                        </span>
                        {item.discountedPrice && (
                          <span className="text-lg text-gray-500 line-through">
                            ₹{item.price}
                          </span>
                        )}
                        {item.discountedPrice && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            {Math.round(((item.price - item.discountedPrice) / item.price * 100))}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantityMutation.mutate({ productId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                          disabled={updateQuantityMutation.isPending || item.quantity <= 1}
                          className="h-8 w-8 p-0 hover:bg-purple-100"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantityMutation.mutate({ productId: item.id, quantity: item.quantity + 1 })}
                          disabled={updateQuantityMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-purple-100"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        disabled={removeItemMutation.isPending}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {removeItemMutation.isPending ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <Card className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Tag className="h-5 w-5" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white mb-2">
                        <Percent className="h-3 w-3 mr-1" />
                        {appliedPromo}
                      </Badge>
                      <p className="text-sm text-green-700 font-medium">{discount}% discount applied</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={removePromoCode} className="border-green-300 text-green-700 hover:bg-green-50">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                      />
                      <Button onClick={applyPromoCode} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        Apply
                      </Button>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium mb-1">Available codes:</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">SAVE10</Badge>
                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">WELCOME20</Badge>
                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">GROUPBUY15</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      Discount ({discount}%)
                    </span>
                    <span className="font-semibold">-₹{discountAmount}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700">
                  <span className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Shipping
                  </span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <Badge className="bg-green-100 text-green-700">FREE</Badge>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                
                <Separator className="bg-purple-200" />
                
                <div className="flex justify-between text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>

                {/* Trust Indicators */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-purple-600">
                      <Truck className="h-4 w-4" />
                      <span>Free shipping over ₹500</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <Shield className="h-4 w-4" />
                      <span>Secure checkout</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>Trusted by 10,000+ customers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}