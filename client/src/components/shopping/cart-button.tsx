import { ShoppingCart, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function CartButton() {
  const { showNotification } = useToastNotifications();
  const { requireAuth } = useAuthGuard();

  const handleCartClick = () => {
    requireAuth("access your cart", () => {
      showNotification("Cart Opened!", "Your shopping cart is ready", "success");
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
      {/* Main Cart Button */}
      <Button
        onClick={handleCartClick}
        className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full shadow-xl hover:scale-110 transition-all duration-300 relative group"
      >
        <ShoppingCart className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        <Badge className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
          3
        </Badge>
      </Button>

      {/* Quick Game Access */}
      <Button
        onClick={() => showNotification("Quick Game!", "Starting daily challenge", "game")}
        className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full shadow-lg hover:scale-110 transition-all duration-300 relative group"
      >
        <Gamepad2 className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      </Button>
    </div>
  );
}
