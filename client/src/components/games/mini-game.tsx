import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, Target, Grid3X3, Brain } from "lucide-react";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useUserData } from "@/hooks/use-user-data";

interface MiniGameProps {
  gameType: "ludo" | "spinwheel" | "2048" | "trivia";
  onComplete?: (score: number, coins: number) => void;
}

export default function MiniGame({ gameType, onComplete }: MiniGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "completed">("idle");
  const { showNotification } = useToastNotifications();
  const { updateCoins } = useUserData();

  const gameConfig = {
    ludo: {
      name: "Ludo",
      icon: Dice1,
      description: "Roll the dice and move your piece!",
      color: "from-red-400 to-red-600"
    },
    spinwheel: {
      name: "Spin Wheel",
      icon: Target,
      description: "Spin to win amazing rewards!",
      color: "from-purple-400 to-purple-600"
    },
    "2048": {
      name: "2048 Merge",
      icon: Grid3X3,
      description: "Merge tiles to reach 2048!",
      color: "from-green-400 to-green-600"
    },
    trivia: {
      name: "Trivia Quiz",
      icon: Brain,
      description: "Test your product knowledge!",
      color: "from-blue-400 to-blue-600"
    }
  };

  const config = gameConfig[gameType];

  const startGame = () => {
    setIsPlaying(true);
    setGameState("playing");
    
    // Simulate game play
    setTimeout(() => {
      const score = Math.floor(Math.random() * 1000) + 100;
      const coins = Math.floor(score / 10);
      
      setGameState("completed");
      setIsPlaying(false);
      
      updateCoins(coins);
      showNotification(`${config.name} Complete!`, `Earned ${coins} coins!`, "game");
      
      onComplete?.(score, coins);
    }, 3000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <config.icon className="h-6 w-6" />
          <span>{config.name}</span>
        </CardTitle>
        <p className="text-sm text-gray-600">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "idle" && (
          <Button 
            onClick={startGame}
            className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
          >
            Start Game
          </Button>
        )}
        
        {gameState === "playing" && (
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 mx-auto bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center animate-spin`}>
              <config.icon className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm text-gray-600">Playing...</p>
          </div>
        )}
        
        {gameState === "completed" && (
          <div className="text-center space-y-4">
            <div className="text-green-600">
              <config.icon className="h-16 w-16 mx-auto mb-2" />
              <p className="font-semibold">Game Complete!</p>
              <p className="text-sm">Great job playing {config.name}!</p>
            </div>
            <Button 
              onClick={() => setGameState("idle")}
              variant="outline"
              className="w-full"
            >
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
