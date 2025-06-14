import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, CreditCard, Smartphone, Wallet, Truck, MapPin, User, Phone, Mail, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City name is required"),
  state: z.string().min(2, "State name is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits"),
  paymentMethod: z.enum(["upi", "wallet", "credit_debit", "cod"]),
  specialInstructions: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  storeName: string;
  storeId: number;
}

export default function VyronaSpaceCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"address" | "payment" | "review">("address");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addressData, setAddressData] = useState<Partial<CheckoutFormData> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      paymentMethod: "upi",
      specialInstructions: "",
    },
  });

  // Load cart from sessionStorage
  useEffect(() => {
    const savedCart = sessionStorage.getItem('vyronaspace-cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
    } else {
      // No cart items, redirect back
      setLocation('/vyronaspace');
    }
  }, [setLocation]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    return 25; // Fixed delivery fee for VyronaSpace
  };

  const finalTotal = calculateTotal() + calculateDeliveryFee();

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create order");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Clear cart from sessionStorage
      sessionStorage.removeItem('vyronaspace-cart');
      
      // Store order data for success page
      sessionStorage.setItem('orderData', JSON.stringify({
        orderId: data.id,
        total: finalTotal,
        items: cartItems,
        module: 'vyronaspace'
      }));
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.id} has been confirmed`,
      });
      
      setLocation('/order-success');
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const handleAddressSubmit = (data: CheckoutFormData) => {
    setAddressData(data);
    setStep("payment");
  };

  const handlePaymentSubmit = (data: CheckoutFormData) => {
    setStep("review");
  };

  const handleFinalSubmit = async () => {
    if (!addressData) return;
    
    setIsSubmitting(true);
    
    const orderData = {
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        storeId: item.storeId
      })),
      totalAmount: finalTotal,
      deliveryFee: calculateDeliveryFee(),
      customerDetails: addressData,
      paymentMethod: form.getValues("paymentMethod"),
      specialInstructions: form.getValues("specialInstructions"),
      module: "space"
    };

    createOrderMutation.mutate(orderData);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <Card className="p-8 text-center">
          <ShoppingCart className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some items to your cart before checkout</p>
          <Button onClick={() => setLocation("/vyronaspace")} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setLocation("/vyronaspace")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to VyronaSpace
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === "address" ? "text-emerald-600" : step === "payment" || step === "review" ? "text-emerald-500" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "address" ? "bg-emerald-600 text-white" : step === "payment" || step === "review" ? "bg-emerald-500 text-white" : "bg-gray-300"}`}>
                1
              </div>
              <span className="ml-2 font-medium">Address</span>
            </div>
            <div className={`w-16 h-0.5 ${step === "payment" || step === "review" ? "bg-emerald-500" : "bg-gray-300"}`}></div>
            <div className={`flex items-center ${step === "payment" ? "text-emerald-600" : step === "review" ? "text-emerald-500" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "payment" ? "bg-emerald-600 text-white" : step === "review" ? "bg-emerald-500 text-white" : "bg-gray-300"}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className={`w-16 h-0.5 ${step === "review" ? "bg-emerald-500" : "bg-gray-300"}`}></div>
            <div className={`flex items-center ${step === "review" ? "text-emerald-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "review" ? "bg-emerald-600 text-white" : "bg-gray-300"}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(step === "address" ? handleAddressSubmit : step === "payment" ? handlePaymentSubmit : handleFinalSubmit)}>
                
                {/* Address Step */}
                {step === "address" && (
                  <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-emerald-900">
                        <MapPin className="h-5 w-5" />
                        Delivery Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="rounded-xl" rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode</FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl">
                        Continue to Payment
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Step */}
                {step === "payment" && (
                  <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-emerald-900">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choose Payment Method</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="upi">UPI Payment</SelectItem>
                                  <SelectItem value="wallet">VyronaWallet</SelectItem>
                                  <SelectItem value="credit_debit">Credit/Debit Card</SelectItem>
                                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="specialInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Instructions (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="rounded-xl" rows={3} placeholder="Any special delivery instructions..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={() => setStep("address")} className="flex-1 rounded-xl">
                          Back to Address
                        </Button>
                        <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl">
                          Review Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Review Step */}
                {step === "review" && addressData && (
                  <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-emerald-900">
                        <ShoppingCart className="h-5 w-5" />
                        Review Order
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Address Summary */}
                      <div>
                        <h3 className="font-semibold mb-2">Delivery Address</h3>
                        <div className="bg-emerald-50 p-4 rounded-xl">
                          <p className="font-medium">{addressData.fullName}</p>
                          <p>{addressData.address}</p>
                          <p>{addressData.city}, {addressData.state} - {addressData.pincode}</p>
                          <p>{addressData.phoneNumber}</p>
                        </div>
                      </div>
                      
                      {/* Payment Method */}
                      <div>
                        <h3 className="font-semibold mb-2">Payment Method</h3>
                        <div className="bg-emerald-50 p-4 rounded-xl">
                          <p className="capitalize">{form.getValues("paymentMethod").replace("_", " ")}</p>
                        </div>
                      </div>
                      
                      {/* Special Instructions */}
                      {form.getValues("specialInstructions") && (
                        <div>
                          <h3 className="font-semibold mb-2">Special Instructions</h3>
                          <div className="bg-emerald-50 p-4 rounded-xl">
                            <p>{form.getValues("specialInstructions")}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={() => setStep("payment")} className="flex-1 rounded-xl">
                          Back to Payment
                        </Button>
                        <Button 
                          type="button" 
                          onClick={handleFinalSubmit}
                          disabled={isSubmitting}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                        >
                          {isSubmitting ? "Placing Order..." : "Place Order"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg sticky top-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-emerald-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.storeName}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{Math.round(item.price * item.quantity)}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{Math.round(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹{calculateDeliveryFee()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{Math.round(finalTotal)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl">
                  <Clock className="h-4 w-4" />
                  <span>Estimated delivery: 8-15 minutes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}