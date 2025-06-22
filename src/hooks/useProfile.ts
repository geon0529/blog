import { ProfilesService } from "@/services/profiles/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => ProfilesService.getProfileById(user?.id || ""),
    refetchOnWindowFocus: true,
    enabled: !!user?.id, // user.id가 있을 때만 쿼리 실행
  });

  // 🔥 핵심: Supabase auth state 변화 리스닝
  useEffect(() => {
    const supabase = createClient();

    console.log("🚀 useProfile 초기화됨");

    // 초기 사용자 상태 가져오기
    const getInitialUser = async () => {
      const {
        data: { user: initialUser },
      } = await supabase.auth.getUser();
      console.log("👤 초기 사용자:", initialUser?.id || "없음");
      setUser(initialUser);
    };

    getInitialUser();

    // 🔑 핵심: auth state 변화 리스너 등록
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 Auth 상태 변화:",
        event,
        "사용자 ID:",
        session?.user?.id || "없음"
      );

      const newUser = session?.user || null;
      setUser(newUser);

      // 로그인/로그아웃 시 캐시 처리
      if (event === "SIGNED_IN") {
        console.log("✅ 로그인 감지 - 프로필 캐시 무효화");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else if (event === "SIGNED_OUT") {
        console.log("❌ 로그아웃 감지 - 프로필 캐시 제거");
        queryClient.removeQueries({ queryKey: ["profile"] });
      }
    });

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      console.log("🧹 useProfile 리스너 정리");
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // 디버깅용 로그
  useEffect(() => {
    console.log("📊 useProfile 상태:", {
      userId: user?.id,
      hasProfile: !!data,
      profileData: data,
    });
  }, [user?.id, data]);

  return {
    profile: data,
    user, // 추가로 user도 반환
  };
}
