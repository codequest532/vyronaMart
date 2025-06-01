import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useUserData() {
  const queryClient = useQueryClient();
  
  // For demo purposes, we'll use user ID 1
  const userId = 1;

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: [`/api/user/${userId}`],
  });

  const updateCoinsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", `/api/user/${userId}/coins`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
    },
  });

  const updateXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", `/api/user/${userId}/xp`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
    },
  });

  const updateCoins = (amount: number) => {
    updateCoinsMutation.mutate(amount);
  };

  const updateXP = (amount: number) => {
    updateXPMutation.mutate(amount);
  };

  return {
    user,
    isLoading,
    error,
    updateCoins,
    updateXP,
    isUpdating: updateCoinsMutation.isPending || updateXPMutation.isPending,
  };
}
