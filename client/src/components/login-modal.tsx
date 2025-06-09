import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, User, Store, Shield, Mail, Lock, Phone, Building, MapPin, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().min(6, "OTP must be 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function LoginModal({ isOpen, onOpenChange, trigger }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('showForgotPassword state:', showForgotPassword);
  }, [showForgotPassword]);

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

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: resetEmail,
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update form when resetEmail changes
  React.useEffect(() => {
    if (resetEmail) {
      resetPasswordForm.setValue('email', resetEmail);
    }
  }, [resetEmail, resetPasswordForm]);

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
      onOpenChange(false);
      
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
        description: "Welcome to VyronaMart! You've received 500 welcome coins.",
      });
      onOpenChange(false);
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
        description: "Welcome to VyronaMart! Your seller account is ready.",
      });
      onOpenChange(false);
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

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      setResetEmail(variables.email);
      setShowForgotPassword(false);
      setShowResetPassword(true);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the password reset code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      // First verify OTP
      await apiRequest("POST", "/api/auth/verify-otp", {
        email: data.email,
        otp: data.otp,
      });
      
      // Then reset password
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setShowResetPassword(false);
      setShowForgotPassword(false);
      setResetEmail("");
      resetPasswordForm.reset();
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. Please login with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onForgotPassword = (data: z.infer<typeof forgotPasswordSchema>) => {
    forgotPasswordMutation.mutate(data);
  };

  const onResetPassword = (data: z.infer<typeof resetPasswordSchema>) => {
    resetPasswordMutation.mutate(data);
  };

  const ModalContent = () => (
    <div className="relative max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              VyronaMart
            </h1>
            <p className="text-gray-600 text-sm">Social Commerce Platform</p>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-0 overflow-hidden">
        <Tabs defaultValue="login" className="w-full">
          <div className="p-4 pb-0">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-xl">
              <TabsTrigger 
                value="login" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <User className="h-4 w-4" />
                Sign Up
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login" className="p-4 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Welcome Back</h3>
              <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
            </div>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
                          className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20" 
                          {...field} 
                        />
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
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    onClick={() => {
                      console.log('Forgot password clicked');
                      setIsTransitioning(true);
                      onOpenChange(false); // Close main modal first
                      setTimeout(() => {
                        setShowForgotPassword(true);
                        setIsTransitioning(false);
                      }, 150); // Add delay to ensure main modal closes first
                    }}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup" className="p-4 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Create Account</h3>
              <p className="text-sm text-gray-600 mt-1">Join our social commerce community</p>
            </div>

            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-lg mb-6">
                <TabsTrigger 
                  value="customer" 
                  className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <User className="h-4 w-4" />
                  Customer
                </TabsTrigger>
                <TabsTrigger 
                  value="seller" 
                  className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Store className="h-4 w-4" />
                  Seller
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer" className="space-y-4">
                <Form {...customerRegisterForm}>
                  <form onSubmit={customerRegisterForm.handleSubmit(onCustomerRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={customerRegisterForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Username" 
                                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                                {...field} 
                              />
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
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Mobile
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Optional" 
                                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                                {...field} 
                              />
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
                          <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                              {...field} 
                            />
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
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Password" 
                                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                                {...field} 
                              />
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
                            <FormLabel className="text-gray-700 font-medium">Confirm</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm" 
                                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                      disabled={customerRegisterMutation.isPending}
                    >
                      {customerRegisterMutation.isPending ? "Creating Account..." : "Create Customer Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="seller" className="space-y-4 max-h-96 overflow-y-auto">
                <Form {...sellerRegisterForm}>
                  <form onSubmit={sellerRegisterForm.handleSubmit(onSellerRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sellerRegisterForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Username" 
                                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                                {...field} 
                              />
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
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Mobile*
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Required" 
                                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                                {...field} 
                              />
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
                          <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sellerRegisterForm.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              Store Name*
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Store name" 
                                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                                {...field} 
                              />
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
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              Business*
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="wholesale">Wholesale</SelectItem>
                                <SelectItem value="dropshipping">Dropshipping</SelectItem>
                                <SelectItem value="services">Services</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={sellerRegisterForm.control}
                      name="storeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Store Description</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Brief description of your store (optional)" 
                              className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                              {...field} 
                            />
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
                          <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Business Address
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Business address (optional)" 
                              className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                              {...field} 
                            />
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
                            <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Password" 
                                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                                {...field} 
                              />
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
                            <FormLabel className="text-gray-700 font-medium">Confirm</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm" 
                                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                      disabled={sellerRegisterMutation.isPending}
                    >
                      {sellerRegisterMutation.isPending ? "Creating Account..." : "Create Seller Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-lg bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 border-0 p-8">
          <ModalContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 border-0 p-6">
          <VisuallyHidden>
            <DialogTitle>Authentication</DialogTitle>
            <DialogDescription>Sign in to your account or create a new one</DialogDescription>
          </VisuallyHidden>
          <ModalContent />
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal - Render directly without nesting */}
      {showForgotPassword && (
        console.log('Rendering forgot password modal with showForgotPassword:', showForgotPassword),
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center" 
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotPassword(false);
              setTimeout(() => onOpenChange(true), 100);
            }
          }}
        >
          <div className="max-w-md w-full mx-4 bg-white rounded-2xl border-0 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Reset Password</h3>
              <p className="text-sm text-gray-600 mt-1">Enter your email to receive a reset code</p>
            </div>
            
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
                          className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setTimeout(() => onOpenChange(true), 100);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Reset Password Modal - Also render directly */}
      {showResetPassword && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center" 
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetPassword(false);
              setTimeout(() => onOpenChange(true), 100);
            }
          }}
        >
          <div className="max-w-md w-full mx-4 bg-white rounded-2xl border-0 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Enter Reset Code</h3>
              <p className="text-sm text-gray-600 mt-1">Check your email for the 6-digit code</p>
            </div>
            
            <Form {...resetPasswordForm}>
              <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                <FormField
                  control={resetPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="hidden"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetPasswordForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 6-digit code" 
                          className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500/20 text-center text-lg tracking-widest" 
                          maxLength={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter new password" 
                          className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Confirm new password" 
                          className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
                    onClick={() => {
                      setShowResetPassword(false);
                      setTimeout(() => onOpenChange(true), 100);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}