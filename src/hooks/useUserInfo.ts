import { CommonService } from "@/services/common/client";
import { useQuery } from "@tanstack/react-query";

export function useUserInfo() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => CommonService.getCurrentUser(false),
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true,
  });
}
