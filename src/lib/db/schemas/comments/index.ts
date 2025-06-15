import { notes } from "@/lib/db/schemas/notes";
import { profiles } from "@/lib/db/schemas/profiles";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  timestamp,
  PgTableWithColumns,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// Comments 테이블
export const comments: PgTableWithColumns<any> = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, {
      onDelete: "cascade", // 노트 삭제 시 댓글도 삭제
    }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, {
      onDelete: "cascade", // 프로필 삭제 시 댓글도 삭제
    }),
  parentId: uuid("parent_id").references(() => comments.id, {
    onDelete: "cascade", // 부모 댓글 삭제 시 대댓글도 삭제
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations 설정
export const commentsRelations = relations(comments, ({ one, many }) => ({
  note: one(notes, {
    fields: [comments.noteId],
    references: [notes.id],
  }),
  author: one(profiles, {
    fields: [comments.authorId],
    references: [profiles.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments, {
    relationName: "comment_replies",
  }),
}));

// Zod 스키마들
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "내용은 필수입니다")
    .max(1000, "댓글은 1,000자 이하여야 합니다")
    .trim(),
  noteId: z.string().uuid("올바른 노트 ID 형식이 아닙니다"),
  authorId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
  parentId: z.string().uuid("올바른 댓글 ID 형식이 아닙니다").optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "내용은 필수입니다")
    .max(1000, "댓글은 1,000자 이하여야 합니다")
    .trim(),
});

// ID 검증용 스키마
export const commentIdSchema = z.object({
  id: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 권한 체크용 스키마
export const commentPermissionSchema = z.object({
  commentId: z.string().uuid("올바른 댓글 ID 형식이 아닙니다"),
  userId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

// 기본 타입들
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
export type CommentId = z.infer<typeof commentIdSchema>;
export type CommentPermission = z.infer<typeof commentPermissionSchema>;
