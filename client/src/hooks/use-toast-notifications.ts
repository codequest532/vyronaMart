import { useState, useCallback } from "react";

interface NotificationState {
  title: string;
  message: string;
  type: "success" | "game" | "achievement";
  isVisible: boolean;
}

export function useToastNotifications() {
  const [notification, setNotification] = useState<NotificationState>({
    title: "",
    message: "",
    type: "success",
    isVisible: false,
  });

  const showNotification = useCallback((
    title: string, 
    message: string, 
    type: "success" | "game" | "achievement" = "success"
  ) => {
    setNotification({
      title,
      message,
      type,
      isVisible: true,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
