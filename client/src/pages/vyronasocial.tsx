import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useGroupBuyCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
  Gift
} from "lucide-react";

export default function VyronaSocial() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useGroupBuyCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({
    address: "",
    phone: "",
    email: ""
  });

  const promoCodes = {
    "GROUPBUY15": 15,
    "SOCIAL25": 25,
    "SHARE10": 10
  };

  const applyPromoCode = () => {
    if (promoCodes[promoCode as keyof typeof promoCodes]) {
      const discountPercent = promoCodes[promoCode as keyof typeof promoCodes];
      setDiscount(discountPercent);
      toast({
        title: "Promo Code Applied!",
        description: `${discountPercent}% discount applied to your group buy order.`,
      });
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "Please check your promo code and try again.",
        variant: "destructive",
      });
    }
  };

  const subtotal = getTotalPrice();
  const discountAmount = (subtotal * discount) / 100;
  const shipping = subtotal > 1500 ? 0 : 99;
  const total = subtotal - discountAmount + shipping;

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add items to your group buy cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    if (!shippingInfo.address || !shippingInfo.phone || !shippingInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all shipping details.",
        variant: "destructive",
      });
      return;
    }

    // Simulate group buy checkout
    clearCart();
    toast({
      title: "Group Buy Order Placed!",
      description: "Your order has been placed successfully. You'll receive updates as more people join the group buy.",
    });
    
    setTimeout(() => setLocation("/vyronahub"), 2000);
  };

  const shareGroupBuy = () => {
    toast({
      title: "Share Link Copied!",
      description: "Share with friends to unlock bigger discounts in your group buy.",
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/vyronahub")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to VyronaHub
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              VyronaSocial Group Buy
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Join friends and save more on bulk purchases
            </p>
          </div>

          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your Group Buy Cart is Empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start a group buy from VyronaHub to unlock amazing discounts
            </p>
            <Button onClick={() => setLocation("/vyronahub")}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/vyronahub")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VyronaHub
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                VyronaSocial Group Buy Checkout
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Complete your group purchase and share with friends for bigger savings
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {getTotalItems()} items
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Group Buy Cart Items */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Group Buy Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-bold text-green-600">
                          ₹{item.discountedPrice}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{item.price}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {item.groupBuyDiscount}% OFF
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Share Group Buy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="w-5 h-5 mr-2" />
                  Invite Friends & Save More
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Share this group buy with friends to unlock bigger discounts!
                </p>
                <Button onClick={shareGroupBuy} className="w-full">
                  <Gift className="w-4 h-4 mr-2" />
                  Share Group Buy Link
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    placeholder="Enter your delivery address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      placeholder="Phone number"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      placeholder="Email address"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card>
              <CardHeader>
                <CardTitle>Apply Promo Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                  <Button onClick={applyPromoCode}>Apply</Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Try: GROUPBUY15, SOCIAL25, SHARE10
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount ({discount}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                
                <Button onClick={handleCheckout} className="w-full mt-4" size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete Group Buy Order
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  Secure checkout • More people joining = bigger discounts
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}