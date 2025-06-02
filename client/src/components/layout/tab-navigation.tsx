import { Home, Users, MapPin, Book, ShoppingBag, UserCircle, Instagram } from "lucide-react";

type TabType = "home" | "vyronahub" | "social" | "space" | "read" | "mall" | "instashop" | "profile";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "vyronahub" as const, label: "VyronaHub", icon: ShoppingBag },
  { id: "social" as const, label: "VyronaSocial", icon: Users },
  { id: "space" as const, label: "VyronaSpace", icon: MapPin },
  { id: "read" as const, label: "VyronaRead", icon: Book },
  { id: "mall" as const, label: "MallConnect", icon: ShoppingBag },
  { id: "instashop" as const, label: "VyronaInstaShop", icon: Instagram },
  { id: "profile" as const, label: "MyVyrona", icon: UserCircle },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="mb-8">
      <div className="flex space-x-2 bg-white rounded-xl p-2 shadow-sm border border-gray-100 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={(e) => {
              console.log("TabNavigation: Clicked", tab.id, "Event:", e);
              console.log("Calling onTabChange with:", tab.id);
              onTabChange(tab.id);
              console.log("onTabChange called");
            }}
            className={`tab-btn flex-shrink-0 cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
              activeTab === tab.id 
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <tab.icon className="h-4 w-4 mb-1" />
            <span className="text-xs font-medium hidden sm:block">{tab.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
