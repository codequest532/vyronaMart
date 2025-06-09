import React from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().min(6, "OTP must be 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ResetPasswordModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
  onBack: () => void;
}

export default function ResetPasswordModal({ isOpen, email, onClose, onSuccess, onBack }: ResetPasswordModalProps) {
  const { toast } = useToast();

  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { 
      email: email,
      otp: "",
      password: "",
      confirmPassword: ""
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string; password: string; confirmPassword: string }) => {
      const response = await apiRequest('POST', '/api/reset-password', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { email: string; otp: string; password: string; confirmPassword: string }) => {
    resetPasswordMutation.mutate(data);
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center" 
      style={{ zIndex: 10000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl border-0 p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Enter Reset Code</h3>
          <p className="text-sm text-gray-600 mt-1">Check your email for the 6-digit code</p>
        </div>
        
        <Form {...resetPasswordForm}>
          <form onSubmit={resetPasswordForm.handleSubmit(onSubmit)} className="space-y-4">
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
                onClick={onBack}
              >
                Back
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
    </div>,
    document.body
  );
}