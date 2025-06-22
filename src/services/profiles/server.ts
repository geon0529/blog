// lib/services/profiles/server.ts - 서버 전용
import "server-only";
import { unstable_cache } from "next/cache";
import { getProfileById as dbGetProfileById } from "@/lib/db/queries/profiles";
import { Profile } from "@/lib/db/schemas";
import { NotFoundError } from "@/lib/api/errors/domain-error";
import { CACHE_KEYS } from "@/types/common.types";

// 캐시 태그 정의
const CACHE_TAGS = {
  PROFILES: "profiles",
  PROFILE_DETAIL: "profile-detail",
} as const;

/**
 * 서버 컴포넌트용 프로필 데이터베이스 직접 접근 서비스
 */
export const service = {
  /**
   * ID로 프로필 개별 조회 (서버용) - 캐시 적용
   */
  async getProfileById(id: string): Promise<Profile> {
    return unstable_cache(
      async (profileId: string) => {
        try {
          const profile = await dbGetProfileById(profileId);
          if (!profile) {
            throw new NotFoundError("프로필");
          }
          return profile;
        } catch (error) {
          throw error;
        }
      },
      [`${CACHE_KEYS.PROFILE}-${id}`],
      {
        tags: [CACHE_TAGS.PROFILES, `${CACHE_TAGS.PROFILE_DETAIL}-${id}`],
        revalidate: 300, // 5분
      }
    )(id);
  },
} as const;

/**
 * 캐시된 프로필 조회 (서버용)
 * 별도로 정의하여 unstable_cache가 올바르게 작동하도록 함
 */
export const getProfileByIdWithCache = unstable_cache(
  async (id: string) => {
    return service.getProfileById(id);
  },
  [CACHE_KEYS.PROFILE],
  {
    tags: [CACHE_TAGS.PROFILES],
    revalidate: 300, // 5분
  }
);

export const ProfilesService = {
  ...service,
  getProfileByIdWithCache,
} as const;
