import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Cart() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  // Mock cart data - in real app this would come from API
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      productId: 6,
      name: "Premium Wireless Headphones",
      price: 2500,
      discountedPrice: 1875, // Group buy discount
      quantity: 1,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      isGroupBuy: true,
      groupBuyDiscount: 25,
      category: "electronics"
    }
  ]);

  const { data: user } = useQuery({
    queryKey: ["/api/current-user"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, itemId, quantity };
    },
    onSuccess: ({ itemId, quantity }) => {
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );
      toast({
        title: "Cart Updated",
        description: "Product quantity updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, itemId };
    },
    onSuccess: ({ itemId }) => {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Item Removed",
        description: "Product removed from cart successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (orderData: any) => {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { 
        success: true, 
        orderId: `VYR-${Date.now()}`,
        totalAmount: orderData.totalAmount 
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Order ${data.orderId} has been placed. You'll receive a confirmation email shortly.`,
      });
      setCartItems([]);
      setAppliedPromo(null);
      setPromoCode("");
      // Navigate to order confirmation or home
      setLocation("/vyronahub");
    },
    onError: () => {
      toast({
        title: "Checkout Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const applyPromoCode = () => {
    const validCodes = ["SAVE10", "WELCOME20", "GROUPBUY15"];
    if (validCodes.includes(promoCode.toUpperCase())) {
      setAppliedPromo(promoCode.toUpperCase());
      toast({
        title: "Promo Code Applied!",
        description: `${promoCode.toUpperCase()} discount has been applied to your order.`,
      });
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "Please enter a valid promo code.",
        variant: "destructive",
      });
    }
  };

  const getPromoDiscount = () => {
    if (!appliedPromo) return 0;
    switch (appliedPromo) {
      case "SAVE10": return 10;
      case "WELCOME20": return 20;
      case "GROUPBUY15": return 15;
      default: return 0;
    }
  };

  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.discountedPrice || item.price) * item.quantity, 0
  );
  
  const groupBuyDiscount = cartItems.reduce((sum, item) => 
    sum + (item.isGroupBuy ? (item.price - item.discountedPrice!) * item.quantity : 0), 0
  );
  
  const promoDiscount = (subtotal * getPromoDiscount()) / 100;
  const shipping = subtotal > 1000 ? 0 : 99; // Free shipping over ₹1000
  const total = subtotal - promoDiscount + shipping;

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate(itemId);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({
      items: cartItems,
      subtotal,
      promoDiscount,
      shipping,
      totalAmount: total,
      appliedPromo
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="w-24 h-24 mx-auto text-gray-400 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">
            Looks like you haven't added anything to your cart yet. 
            Start shopping to find great deals!
          </p>
          <Button 
            onClick={() => setLocation("/vyronahub")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/vyronahub")}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Badge variant="secondary" className="ml-2">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-600 capitalize">{item.category}</p>
                      {item.isGroupBuy && (
                        <Badge className="bg-green-100 text-green-800 mt-1">
                          <Tag className="w-3 h-3 mr-1" />
                          Group Buy {item.groupBuyDiscount}% OFF
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      {item.isGroupBuy && (
                        <p className="text-sm text-gray-500 line-through">
                          ₹{item.price.toLocaleString()}
                        </p>
                      )}
                      <p className="font-bold text-lg">
                        ₹{((item.discountedPrice || item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    disabled={!!appliedPromo}
                  />
                  {!appliedPromo ? (
                    <Button 
                      variant="outline" 
                      onClick={applyPromoCode}
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode("");
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {appliedPromo && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {appliedPromo} applied ({getPromoDiscount()}% off)
                  </p>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                
                {groupBuyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Group Buy Savings</span>
                    <span>-₹{groupBuyDiscount.toLocaleString()}</span>
                  </div>
                )}

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount ({getPromoDiscount()}%)</span>
                    <span>-₹{promoDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>

                {shipping > 0 && subtotal < 1000 && (
                  <p className="text-xs text-gray-500">
                    Add ₹{(1000 - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {checkoutMutation.isPending ? "Processing..." : "Proceed to Checkout"}
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-4">
                <Shield className="w-4 h-4" />
                <span>Secure & encrypted checkout</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}