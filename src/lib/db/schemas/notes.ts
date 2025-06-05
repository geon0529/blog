import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// 📝 사용자 정보가 포함된 노트 타입 (필요시)
export type NoteWithAuthor = Note & {
  authorName?: string;
  authorEmail?: string;
};
