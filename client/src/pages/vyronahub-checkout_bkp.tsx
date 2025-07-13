import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, MapPin, CreditCard, Wallet, Truck, DollarSign, ShoppingCart, Package, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/lib/cart-store";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email address is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Complete address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  paymentMethod: z.enum(["credit_debit", "upi", "vyronawallet", "cod"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  module: string;
  imageUrl?: string;
}

export default function VyronaHubCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"address" | "payment" | "review">("address");
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
      paymentMethod: "credit_debit",
    },
  });

  // Get URL parameters for direct product purchase
  const urlParams = new URLSearchParams(window.location.search);
  const directProductId = urlParams.get('productId');
  const directQuantity = parseInt(urlParams.get('quantity') || '1');

  // Get cart data from client store
  const { items: cartItems, clearCart } = useCartStore();

  // Get user wallet balance
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch direct product data if coming from "Buy Now"
  const { data: directProduct } = useQuery({
    queryKey: [`/api/products/${directProductId}`],
    enabled: !!directProductId,
  });

  // Determine checkout items - either from cart or direct product
  const getCheckoutItems = (): CheckoutCartItem[] => {
    if (directProductId && directProduct) {
      // Direct product purchase
      return [{
        id: directProduct.id,
        name: directProduct.name,
        price: directProduct.price,
        quantity: directQuantity,
        category: directProduct.category,
        module: "vyronahub",
        imageUrl: directProduct.imageUrl
      }];
    } else {
      // Cart checkout
      return cartItems.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.discountedPrice || item.price,
        quantity: item.quantity,
        category: item.category,
        module: "vyronahub",
        imageUrl: item.imageUrl
      }));
    }
  };

  const typedCartItems = getCheckoutItems();

  // Calculate totals
  const subtotal = typedCartItems.reduce((sum: number, item: CheckoutCartItem) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
  const total = subtotal + deliveryFee;

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      // Only clear cart if this was a cart checkout, not a direct product purchase
      if (!directProductId) {
        clearCart();
      }
      
      // Prepare order success data
      const orderSuccessData = {
        orderId: data.id,
        items: typedCartItems.map((item: CheckoutCartItem) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          fullName: addressData?.fullName || '',
          phoneNumber: addressData?.phoneNumber || '',
          address: addressData?.address || '',
          city: addressData?.city || '',
          state: addressData?.state || '',
          pincode: addressData?.pincode || '',
        },
        paymentMethod: addressData?.paymentMethod || '',
        totalAmount: total,
        orderDate: new Date().toISOString(),
      };
      
      // Store order data in sessionStorage for the success page
      sessionStorage.setItem('orderSuccessData', JSON.stringify(orderSuccessData));
      
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setLocation("/order-success");
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onAddressSubmit = (data: CheckoutFormData) => {
    setAddressData(data);
    setStep("payment");
  };

  const onPaymentSubmit = (data: CheckoutFormData) => {
    setAddressData(prev => ({ ...prev, ...data }));
    setStep("review");
  };

  const onFinalSubmit = async () => {
    if (!addressData) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        items: typedCartItems.map((item: CheckoutCartItem) => ({
          productId: item.id,
          quantity: item.quantity,
          price: Math.round(item.price) // Amount in rupees
        })),
        totalAmount: Math.round(total), // Amount in rupees
        shippingAddress: {
          fullName: addressData.fullName,
          phoneNumber: addressData.phoneNumber,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
        },
        paymentMethod: addressData.paymentMethod,
        module: "vyronahub",
        metadata: {
          deliveryFee: Math.round(deliveryFee), // Amount in rupees
          subtotal: Math.round(subtotal) // Amount in rupees
        },
      };

      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      console.error("Order submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Your cart is empty</p>
          <Button onClick={() => setLocation("/vyronahub")} className="mt-4">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!typedCartItems || typedCartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some items to your cart before checkout</p>
          <Button onClick={() => setLocation("/vyronahub")}>Continue Shopping</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setLocation("/vyronahub")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to VyronaHub
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === "address" ? "text-blue-600" : step === "payment" || step === "review" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "address" ? "bg-blue-600 text-white" : step === "payment" || step === "review" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                1
              </div>
              <span className="ml-2 font-medium">Address</span>
            </div>
            <div className="w-12 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step === "payment" ? "text-blue-600" : step === "review" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "payment" ? "bg-blue-600 text-white" : step === "review" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className="w-12 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step === "review" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "review" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === "address" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                  <CardDescription>
                    Enter your complete delivery address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddressSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email address" {...field} />
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
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complete Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="House/Flat no., Building, Street, Area"
                                rows={3}
                                {...field}
                              />
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
                                <Input placeholder="Enter city" {...field} />
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
                                <Input placeholder="Enter state" {...field} />
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
                                <Input placeholder="Enter pincode" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Continue to Payment
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPaymentSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-4"
                              >
                                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                                  <RadioGroupItem value="credit_debit" id="credit_debit" />
                                  <Label htmlFor="credit_debit" className="flex items-center cursor-pointer">
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    <div>
                                      <div className="font-medium">Credit/Debit Card</div>
                                      <div className="text-sm text-gray-500">Pay securely with your card</div>
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                                  <RadioGroupItem value="upi" id="upi" />
                                  <Label htmlFor="upi" className="flex items-center cursor-pointer">
                                    <DollarSign className="h-5 w-5 mr-2" />
                                    <div>
                                      <div className="font-medium">UPI Payment</div>
                                      <div className="text-sm text-gray-500">Pay using UPI ID or QR code</div>
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                                  <RadioGroupItem value="vyronawallet" id="vyronawallet" />
                                  <Label htmlFor="vyronawallet" className="flex items-center cursor-pointer">
                                    <Wallet className="h-5 w-5 mr-2" />
                                    <div>
                                      <div className="font-medium">VyronaWallet</div>
                                      <div className="text-sm text-gray-500">
                                        Available Balance: {formatCurrency((userData as any)?.walletBalance * 100 || 0)}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                                  <RadioGroupItem value="cod" id="cod" />
                                  <Label htmlFor="cod" className="flex items-center cursor-pointer">
                                    <Truck className="h-5 w-5 mr-2" />
                                    <div>
                                      <div className="font-medium">Cash on Delivery</div>
                                      <div className="text-sm text-gray-500">Pay when your order arrives</div>
                                    </div>
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-4">
                        <Button type="button" variant="outline" onClick={() => setStep("address")} className="flex-1">
                          Back
                        </Button>
                        <Button type="submit" className="flex-1">
                          Review Order
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {step === "review" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Review Your Order
                  </CardTitle>
                  <CardDescription>
                    Confirm your order details before placing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Address */}
                  <div>
                    <h3 className="font-medium mb-2">Delivery Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{addressData?.fullName}</p>
                      <p className="text-sm text-gray-600">{addressData?.phoneNumber}</p>
                      <p className="text-sm text-gray-600">{addressData?.address}</p>
                      <p className="text-sm text-gray-600">
                        {addressData?.city}, {addressData?.state} - {addressData?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">
                        {addressData?.paymentMethod === "credit_debit" && "Credit/Debit Card"}
                        {addressData?.paymentMethod === "upi" && "UPI Payment"}
                        {addressData?.paymentMethod === "vyronawallet" && "VyronaWallet"}
                        {addressData?.paymentMethod === "cod" && "Cash on Delivery"}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-2">Order Items</h3>
                    <div className="space-y-3">
                      {typedCartItems.map((item: CheckoutCartItem) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="button" variant="outline" onClick={() => setStep("payment")} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={onFinalSubmit} 
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {typedCartItems.map((item: CheckoutCartItem) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}</span>
                  </div>
                  {deliveryFee === 0 && (
                    <div className="text-xs text-green-600">Free delivery on orders above ₹500</div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}