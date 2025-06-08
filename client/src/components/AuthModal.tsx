import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, User, Store, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const customerRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  mobile: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const sellerRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  mobile: z.string().min(1, "Mobile number is required for sellers"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  storeName: z.string().min(1, "Store name is required"),
  storeDescription: z.string().optional(),
  businessType: z.string().min(1, "Business type is required"),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "customer" | "seller";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const customerRegisterForm = useForm<z.infer<typeof customerRegisterSchema>>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    },
  });

  const sellerRegisterForm = useForm<z.infer<typeof sellerRegisterSchema>>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      storeName: "",
      storeDescription: "",
      businessType: "",
      address: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      onClose();
      
      // Redirect based on role
      if (data.user.role === "admin") {
        setLocation("/admin-dashboard");
      } else if (data.user.role === "seller") {
        setLocation("/seller-dashboard");
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const customerRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerRegisterSchema>) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        ...data,
        role: "customer"
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Account Created",
        description: "Welcome to Vyrona! You've received 500 welcome coins.",
      });
      onClose();
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const sellerRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sellerRegisterSchema>) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        ...data,
        role: "seller"
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Seller Account Created",
        description: "Welcome to Vyrona! Your seller account is ready.",
      });
      onClose();
      setLocation("/seller-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create seller account",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onCustomerRegister = (data: z.infer<typeof customerRegisterSchema>) => {
    customerRegisterMutation.mutate(data);
  };

  const onSellerRegister = (data: z.infer<typeof sellerRegisterSchema>) => {
    sellerRegisterMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <DialogTitle className="text-2xl">Vyrona</DialogTitle>
          </div>
          <DialogDescription>
            Your social commerce platform
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Customer
            </TabsTrigger>
            <TabsTrigger value="seller" className="flex items-center gap-1">
              <Store className="h-4 w-4" />
              Seller
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Join as Customer</h3>
              <p className="text-sm text-gray-600">Shop, socialize, and earn rewards</p>
            </div>
            
            <Form {...customerRegisterForm}>
              <form onSubmit={customerRegisterForm.handleSubmit(onCustomerRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={customerRegisterForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerRegisterForm.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={customerRegisterForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={customerRegisterForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerRegisterForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={customerRegisterMutation.isPending}
                >
                  {customerRegisterMutation.isPending ? "Creating Account..." : "Create Customer Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="seller" className="space-y-4 max-h-96 overflow-y-auto">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Join as Seller</h3>
              <p className="text-sm text-gray-600">Start your business with us</p>
            </div>
            
            <Form {...sellerRegisterForm}>
              <form onSubmit={sellerRegisterForm.handleSubmit(onSellerRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={sellerRegisterForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellerRegisterForm.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile *</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={sellerRegisterForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={sellerRegisterForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellerRegisterForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={sellerRegisterForm.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your store name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellerRegisterForm.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fashion">Fashion & Clothing</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="books">Books & Education</SelectItem>
                          <SelectItem value="home">Home & Garden</SelectItem>
                          <SelectItem value="health">Health & Beauty</SelectItem>
                          <SelectItem value="sports">Sports & Fitness</SelectItem>
                          <SelectItem value="food">Food & Beverages</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellerRegisterForm.control}
                  name="storeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your store" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellerRegisterForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={sellerRegisterMutation.isPending}
                >
                  {sellerRegisterMutation.isPending ? "Creating Account..." : "Create Seller Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}