import { useState } from "react";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";

export function useAuthGuard() {
  const { user } = useUserData();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const requireAuth = (action: string, callback?: () => void) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: `Please log in to ${action}.`,
        variant: "destructive",
      });
      setShowLoginModal(true);
      return false;
    }
    
    if (callback) {
      callback();
    }
    return true;
  };

  const requireAuthForAction = (action: string) => {
    return (callback: () => void) => {
      requireAuth(action, callback);
    };
  };

  return {
    user,
    isAuthenticated: !!user,
    requireAuth,
    requireAuthForAction,
    showLoginModal,
    setShowLoginModal,
  };
}