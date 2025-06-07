import { profiles } from "@/lib/db/schemas/profiles";
import { notes } from "@/lib/db/schemas/notes";
import { relations } from "drizzle-orm";
import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

// 좋아요 테이블 (중간 테이블) - 단순한 방식
export const noteLikes = pgTable("note_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, {
      onDelete: "cascade", // 노트 삭제 시 좋아요도 삭제
    }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, {
      onDelete: "cascade", // 프로필 삭제 시 좋아요도 삭제
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations 설정
export const noteLikesRelations = relations(noteLikes, ({ one }) => ({
  note: one(notes, {
    fields: [noteLikes.noteId],
    references: [notes.id],
  }),
  user: one(profiles, {
    fields: [noteLikes.userId],
    references: [profiles.id],
  }),
}));

// 좋아요 관련 Zod 스키마들
export const createNoteLikeSchema = z.object({
  noteId: z.string().uuid("올바른 노트 ID 형식이 아닙니다"),
  userId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

export const deleteNoteLikeSchema = z.object({
  noteId: z.string().uuid("올바른 노트 ID 형식이 아닙니다"),
  userId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

export const toggleNoteLikeSchema = z.object({
  noteId: z.string().uuid("올바른 노트 ID 형식이 아닙니다"),
  userId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

// 기본 타입들
export type NoteLike = typeof noteLikes.$inferSelect;
export type NewNoteLike = typeof noteLikes.$inferInsert;

// Zod 스키마 타입들
export type CreateNoteLike = z.infer<typeof createNoteLikeSchema>;
export type DeleteNoteLike = z.infer<typeof deleteNoteLikeSchema>;
export type ToggleNoteLike = z.infer<typeof toggleNoteLikeSchema>;

// 좋아요 관련 확장 타입들
export type NoteLikeWithUser = {
  id: string;
  noteId: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
};
