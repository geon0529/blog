import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { z } from "zod";

// Posts 테이블 정의
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  views: integer("views").default(0).notNull(),
  likedUserIds: text("liked_user_ids").array().default([]).notNull(), // 좋아요한 유저 ID 배열
  tags: text("tags").array().default([]).notNull(), // 태그 배열
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 실제 사용할 스키마들
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다")
    .max(200, "제목은 200자 이하여야 합니다")
    .trim(),
  content: z
    .string()
    .min(1, "내용은 필수입니다")
    .max(50000, "내용은 50,000자 이하여야 합니다") // 포스트는 노트보다 길 수 있음
    .trim(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(10, "태그는 최대 10개까지 가능합니다")
    .default([])
    .optional(),
});

// 업데이트용 스키마 (모든 필드 선택적)
export const updatePostSchema = createPostSchema.partial();

// ID 검증용 스키마
export const postIdSchema = z.object({
  id: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 좋아요 토글용 스키마
export const toggleLikeSchema = z.object({
  postId: z.string().uuid("올바른 UUID 형식이 아닙니다"),
  userId: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 조회수 증가용 스키마
export const incrementViewSchema = z.object({
  postId: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 태그 검색용 스키마
export const searchByTagSchema = z.object({
  tag: z.string().min(1, "태그는 필수입니다").trim(),
});

// 파생 타입
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type PostId = z.infer<typeof postIdSchema>;
export type ToggleLike = z.infer<typeof toggleLikeSchema>;
export type IncrementView = z.infer<typeof incrementViewSchema>;
export type SearchByTag = z.infer<typeof searchByTagSchema>;

// 유틸리티 타입 (좋아요 수 계산용)
export type PostWithLikeCount = Post & {
  likeCount: number;
  isLikedByUser?: boolean; // 현재 사용자가 좋아요했는지 여부
};
