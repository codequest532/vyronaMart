// This file contains helper functions for mock data generation
// Used for demonstration purposes in the gamified shopping platform

export const generateMockProducts = (count: number = 10) => {
  const categories = ["electronics", "fashion", "books", "home", "sports"];
  const modules = ["social", "space", "read", "mall"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    description: `High quality product ${i + 1}`,
    price: Math.floor(Math.random() * 100000) + 1000, // in cents
    category: categories[Math.floor(Math.random() * categories.length)],
    module: modules[Math.floor(Math.random() * modules.length)],
    imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop`,
    storeId: Math.floor(Math.random() * 5) + 1,
  }));
};

export const generateMockStores = (count: number = 5) => {
  const types = ["kirana", "fashion", "electronics", "lifestyle", "mall", "library"];
  const areas = ["T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Mylapore"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Store ${i + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    address: `${areas[Math.floor(Math.random() * areas.length)]}, Chennai`,
    latitude: "13.0827",
    longitude: "80.2707",
    isOpen: Math.random() > 0.2,
    rating: Math.floor(Math.random() * 100) + 400, // 4.0 to 5.0 stars
    reviewCount: Math.floor(Math.random() * 1000) + 50,
  }));
};

export const generateGameRewards = () => {
  const gameTypes = ["ludo", "trivia", "2048", "spinwheel", "treasure_hunt", "memory_match"];
  
  return gameTypes.map(gameType => ({
    gameType,
    baseReward: Math.floor(Math.random() * 100) + 20,
    multiplier: Math.random() * 2 + 1,
  }));
};

export const mockAchievements = [
  { type: "first_purchase", name: "First Purchase", description: "Made your first purchase on VyronaMart" },
  { type: "social_shopper", name: "Social Shopper", description: "Joined your first shopping room" },
  { type: "game_master", name: "Game Master", description: "Played 10 different games" },
  { type: "book_lover", name: "Book Lover", description: "Purchased or rented 5 books" },
  { type: "local_explorer", name: "Local Explorer", description: "Visited 3 local stores" },
  { type: "mall_expert", name: "Mall Expert", description: "Purchased from 5 different mall brands" },
];

export const calculateLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 1000) + 1;
};

export const calculateXPToNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevelFromXP(currentXP);
  const nextLevelXP = currentLevel * 1000;
  return nextLevelXP - currentXP;
};

export const formatCurrency = (cents: number): string => {
  return `₹${(cents / 100).toLocaleString('en-IN')}`;
};

export const formatCoins = (coins: number): string => {
  if (coins >= 1000000) {
    return `${(coins / 1000000).toFixed(1)}M`;
  } else if (coins >= 1000) {
    return `${(coins / 1000).toFixed(1)}K`;
  }
  return coins.toString();
};
