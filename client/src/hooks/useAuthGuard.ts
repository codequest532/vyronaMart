import { useUserData } from "./use-user-data";
import { useToast } from "./use-toast";

export function useAuthGuard() {
  const { user, isLoading } = useUserData();
  const { toast } = useToast();

  const requireAuth = (action: string, onAuthenticated?: () => void) => {
    if (isLoading) return false;
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: `Please log in to ${action}`,
        variant: "destructive",
      });
      
      // Trigger login modal by dispatching a custom event
      window.dispatchEvent(new CustomEvent('auth-required', { 
        detail: { action } 
      }));
      
      return false;
    }
    
    if (onAuthenticated) {
      onAuthenticated();
    }
    
    return true;
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    requireAuth
  };
}