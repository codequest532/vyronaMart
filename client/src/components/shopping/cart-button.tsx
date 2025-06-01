import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToastNotifications } from "@/hooks/use-toast-notifications";

export default function CartButton() {
  const { showNotification } = useToastNotifications();

  const handleCartClick = () => {
    showNotification("Cart Opened!", "Your shopping cart is ready", "success");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleCartClick}
        className="w-14 h-14 vyrona-gradient-primary rounded-full shadow-lg hover:scale-110 transition-transform relative"
      >
        <ShoppingCart className="h-5 w-5 text-white" />
        <Badge className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-0 flex items-center justify-center text-xs font-bold">
          3
        </Badge>
      </Button>
    </div>
  );
}
