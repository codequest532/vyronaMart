import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2,
  CreditCard,
  Truck,
  Shield
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useCartStore();
  
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

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

    toast({
      title: "Order Placed Successfully!",
      description: `Your order of ${getTotalItems()} items has been placed. Total: ₹${total.toFixed(2)}`,
    });
    
    clearCart();
    setAppliedPromo(null);
    setDiscount(0);
    setLocation("/vyronahub");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="h-10 w-10 text-blue-500" />
              Shopping Cart
            </h1>
            <Button
              variant="outline"
              onClick={() => setLocation("/vyronahub")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </div>

          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start shopping to add items to your cart
              </p>
              <Button onClick={() => setLocation("/vyronahub")} className="w-full">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="h-10 w-10 text-blue-500" />
            Shopping Cart ({getTotalItems()} items)
          </h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/vyronahub")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{item.category}</p>
                      {item.isGroupBuy && (
                        <Badge variant="secondary" className="mt-1">
                          Group Buy - {item.groupBuyDiscount}% OFF
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl font-bold text-blue-600">
                          ₹{(item.discountedPrice || item.price).toFixed(2)}
                        </span>
                        {item.discountedPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
            <Card>
              <CardHeader>
                <CardTitle>Promo Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <Badge variant="secondary">{appliedPromo}</Badge>
                      <p className="text-sm text-green-600 mt-1">{discount}% discount applied</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={removePromoCode}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button onClick={applyPromoCode}>Apply</Button>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Try: SAVE10, WELCOME20, GROUPBUY15
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>

                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Free shipping over ₹500
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Secure checkout
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