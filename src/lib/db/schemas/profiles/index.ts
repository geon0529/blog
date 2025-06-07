import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { notes } from "@/lib/db/schemas/notes";

// Profiles 테이블 스키마
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // auth.users의 id를 직접 사용 (수동 삽입)
  email: text("email"), // nullable - auth에서 동기화
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  website: text("website"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 관계 정의
export const profilesRelations = relations(profiles, ({ many }) => ({
  notes: many(notes),
}));

// 자동 프로필 생성용 스키마 (DB 트리거나 서버에서 사용)
export const autoCreateProfileSchema = z.object({
  id: z.string().uuid(), // auth.users.id에서 가져옴
  email: z.string().email().optional(), // auth에서 동기화
  fullName: z.string().optional(), // auth.user_metadata에서 가져오거나 이메일에서 추출
});

// 사용자 프로필 생성/업데이트용 스키마 (UI에서 사용)
export const createProfileSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요").optional(),
  fullName: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(100, "이름은 100자 이하여야 합니다")
    .trim()
    .optional(),
  bio: z.string().max(500, "소개는 500자 이하여야 합니다").trim().optional(),
  website: z
    .string()
    .url("올바른 웹사이트 URL을 입력해주세요")
    .optional()
    .or(z.literal("")), // 빈 문자열 허용
  location: z
    .string()
    .max(100, "위치는 100자 이하여야 합니다")
    .trim()
    .optional(),
});

// 프로필 업데이트용 스키마 (모든 필드 optional)
export const updateProfileSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요").optional(),
  fullName: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(100, "이름은 100자 이하여야 합니다")
    .trim()
    .optional(),
  bio: z.string().max(500, "소개는 500자 이하여야 합니다").trim().optional(),
  website: z
    .string()
    .url("올바른 웹사이트 URL을 입력해주세요")
    .optional()
    .or(z.literal("")), // 빈 문자열 허용 (웹사이트 삭제 시)
  location: z
    .string()
    .max(100, "위치는 100자 이하여야 합니다")
    .trim()
    .optional(),
});

// ID 검증용 스키마
export const profileIdSchema = z.object({
  id: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

// 이메일 검증용 스키마 (중복 확인 등에 사용)
export const emailSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요"),
});

// 아바타 업로드용 스키마
export const avatarUpdateSchema = z.object({
  avatarUrl: z.string().url("올바른 이미지 URL을 입력해주세요").optional(),
});

// 파생 타입
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type CreateProfile = z.infer<typeof createProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ProfileId = z.infer<typeof profileIdSchema>;
export type EmailCheck = z.infer<typeof emailSchema>;
export type AvatarUpdate = z.infer<typeof avatarUpdateSchema>;

// 프로필 공개 정보 타입 (민감한 정보 제외)
export type PublicProfile = Pick<
  Profile,
  "id" | "fullName" | "bio" | "avatarUrl" | "website" | "location"
>;

// 프로필 통계 정보 포함 타입 (필요시)
export type ProfileWithStats = Profile & {
  noteCount?: number;
  followerCount?: number;
  followingCount?: number;
};
