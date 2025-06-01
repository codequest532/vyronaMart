import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useUserData() {
  const queryClient = useQueryClient();
  
  // Check if we have a current user stored in the query cache
  const currentUser = queryClient.getQueryData<User>(["/api/current-user"]);
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/current-user"],
    enabled: false, // Only fetch when explicitly enabled
    retry: false,
  });

  const actualUser = user || currentUser;

  const updateCoinsMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!actualUser) throw new Error("No user logged in");
      const response = await apiRequest("POST", `/api/user/${actualUser.id}/coins`, { amount });
      return response.json();
    },
    onSuccess: () => {
      if (actualUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/user/${actualUser.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/current-user"] });
      }
    },
  });

  const updateXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!actualUser) throw new Error("No user logged in");
      const response = await apiRequest("POST", `/api/user/${actualUser.id}/xp`, { amount });
      return response.json();
    },
    onSuccess: () => {
      if (actualUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/user/${actualUser.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/current-user"] });
      }
    },
  });

  const updateCoins = (amount: number) => {
    updateCoinsMutation.mutate(amount);
  };

  const updateXP = (amount: number) => {
    updateXPMutation.mutate(amount);
  };

  return {
    user: actualUser,
    isLoading: false, // We'll manage auth state manually
    error,
    updateCoins,
    updateXP,
    isUpdating: updateCoinsMutation.isPending || updateXPMutation.isPending,
  };
}
