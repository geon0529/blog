import { profiles } from "@/lib/db/schemas/profiles";
import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

// Notes 테이블 (관계 설정을 위해 추가)
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, {
      onDelete: "cascade", // 프로필 삭제 시 노트도 삭제
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notesRelations = relations(notes, ({ one }) => ({
  author: one(profiles, {
    fields: [notes.authorId],
    references: [profiles.id],
  }),
}));

export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다")
    .max(200, "제목은 200자 이하여야 합니다")
    .trim(),
  content: z
    .string()
    .min(1, "내용은 필수입니다")
    .max(10000, "내용은 10,000자 이하여야 합니다")
    .trim(),
  authorId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다")
    .max(200, "제목은 200자 이하여야 합니다")
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, "내용은 필수입니다")
    .max(10000, "내용은 10,000자 이하여야 합니다")
    .trim()
    .optional(),
});

// ID 검증용 스키마
export const noteIdSchema = z.object({
  id: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 권한 체크용 스키마
export const notePermissionSchema = z.object({
  noteId: z.string().uuid("올바른 노트 ID 형식이 아닙니다"),
  userId: z.string().uuid("올바른 사용자 ID 형식이 아닙니다"),
});

// 파생 타입
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type CreateNote = z.infer<typeof createNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
export type NoteId = z.infer<typeof noteIdSchema>;
export type NotePermission = z.infer<typeof notePermissionSchema>;

// Notes 테이블과 Profile 테이블의 관계를 위한 확장된 타입들
export type NoteWithAuthor = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
};
