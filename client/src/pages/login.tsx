import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("login");
  const [registrationType, setRegistrationType] = useState<"customer" | "seller">("customer");

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      // Update the query cache with the logged-in user
      queryClient.setQueryData(["/api/current-user"], data.user);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      // Route based on user role
      switch (data.user.role) {
        case "admin":
          setLocation("/admin");
          break;
        case "seller":
          setLocation("/seller");
          break;
        default:
          setLocation("/");
          break;
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
      const { confirmPassword, ...submitData } = data;
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...submitData, role: "customer" }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Registration Successful",
        description: "Welcome to VyronaMart!",
      });
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
      const { confirmPassword, ...submitData } = data;
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...submitData, role: "seller" }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Seller Registration Successful", 
        description: "Welcome to VyronaMart! Your seller account is ready.",
      });
      setLocation("/seller-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Seller Registration Failed",
        description: error.message || "Failed to create seller account",
        variant: "destructive",
      });
    },
  });

  const onLogin = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  const onCustomerRegister = (values: z.infer<typeof customerRegisterSchema>) => {
    customerRegisterMutation.mutate(values);
  };

  const onSellerRegister = (values: z.infer<typeof sellerRegisterSchema>) => {
    sellerRegisterMutation.mutate(values);
  };

  const roleIcons = {
    customer: <User className="h-5 w-5" />,
    seller: <Store className="h-5 w-5" />,
  };

  const roleDescriptions = {
    customer: "Shop and explore products across VyronaMart",
    seller: "Manage your store and sell products",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaMart</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Your comprehensive shopping platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Access your VyronaMart account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
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
                            <Input type="password" placeholder="Enter your password" {...field} />
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
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      type="button"
                      variant={registrationType === "customer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRegistrationType("customer")}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Customer
                    </Button>
                    <Button
                      type="button"
                      variant={registrationType === "seller" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRegistrationType("seller")}
                      className="flex items-center gap-2"
                    >
                      <Store className="h-4 w-4" />
                      Seller
                    </Button>
                  </div>

                  {registrationType === "customer" ? (
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
                                <Input type="email" placeholder="Enter your email" {...field} />
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
                                  <Input type="password" placeholder="Create password" {...field} />
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
                  ) : (
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
                                <FormLabel>Mobile Number *</FormLabel>
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
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="wholesale">Wholesale</SelectItem>
                                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="services">Services</SelectItem>
                                  <SelectItem value="food">Food & Beverage</SelectItem>
                                  <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                                  <SelectItem value="electronics">Electronics</SelectItem>
                                  <SelectItem value="books">Books & Media</SelectItem>
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

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={sellerRegisterForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Create password" {...field} />
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

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={sellerRegisterMutation.isPending}
                        >
                          {sellerRegisterMutation.isPending ? "Creating Account..." : "Create Seller Account"}
                        </Button>
                      </form>
                    </Form>
                  )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}