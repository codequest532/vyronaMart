import { useEffect, useState } from "react";
import { Coins, Gamepad2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NotificationToastProps {
  title?: string;
  message?: string;
  type?: "success" | "game" | "achievement";
  isVisible?: boolean;
  onHide?: () => void;
}

export default function NotificationToast({ 
  title = "", 
  message = "", 
  type = "success", 
  isVisible = false,
  onHide 
}: NotificationToastProps) {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    setVisible(isVisible);
    if (isVisible) {
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case "game":
        return <Gamepad2 className="text-purple-600 h-5 w-5" />;
      case "achievement":
        return <CheckCircle className="text-green-600 h-5 w-5" />;
      default:
        return <Coins className="text-green-600 h-5 w-5" />;
    }
  };

  return (
    <div className={`fixed top-20 right-4 z-50 transform transition-transform duration-300 ${
      visible ? "translate-x-0" : "translate-x-full"
    }`}>
      <Card className="bg-white border border-green-200 shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              {getIcon()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-gray-500">{message}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
