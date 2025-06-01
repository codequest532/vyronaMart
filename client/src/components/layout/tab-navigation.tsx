import { Home, Users, MapPin, Book, ShoppingBag, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabType = "home" | "social" | "space" | "read" | "mall" | "profile";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "social" as const, label: "VyronaSocial", icon: Users },
  { id: "space" as const, label: "VyronaSpace", icon: MapPin },
  { id: "read" as const, label: "VyronaRead", icon: Book },
  { id: "mall" as const, label: "MallConnect", icon: ShoppingBag },
  { id: "profile" as const, label: "MyVyrona", icon: UserCircle },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="mb-8">
      <div className="flex space-x-2 bg-white rounded-xl p-2 shadow-sm border border-gray-100 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              console.log("TabNavigation: Clicked", tab.id);
              onTabChange(tab.id);
            }}
            className={`tab-btn flex-shrink-0 ${
              activeTab === tab.id 
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <tab.icon className="h-4 w-4 mb-1" />
            <span className="text-xs font-medium hidden sm:block">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
