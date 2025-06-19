import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useUserData() {
  const queryClient = useQueryClient();
  
  // Check if we have a current user stored in the query cache
  const currentUser = queryClient.getQueryData<User>(["/api/auth/me"]);
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute for better real-time updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.status === 401) {
          return null;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Auth response:", data);
        return data.success ? data.user : null;
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    },
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
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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
    isLoading,
    error,
    updateCoins,
    updateXP,
    isUpdating: updateCoinsMutation.isPending || updateXPMutation.isPending,
  };
}
