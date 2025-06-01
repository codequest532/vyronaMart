import { Coins, Star, User, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User as UserType } from "@shared/schema";

interface HeaderProps {
  user: UserType;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b-2 border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 vyrona-gradient-primary rounded-xl flex items-center justify-center">
              <Gamepad2 className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VyronaMart</h1>
              <p className="text-xs text-gray-500">Play. Shop. Connect.</p>
            </div>
          </div>

          {/* User Coins & Profile */}
          <div className="flex items-center space-x-4">
            {/* VyronaCoins */}
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
              <Coins className="mr-1 h-3 w-3" />
              {user.vyronaCoins.toLocaleString()}
            </Badge>
            
            {/* XP Level */}
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
              <Star className="mr-1 h-3 w-3" />
              Lv.{user.level}
            </Badge>

            {/* Profile Avatar */}
            <Avatar className="w-8 h-8 cursor-pointer vyrona-gradient-profile">
              <AvatarFallback className="text-white text-sm">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
