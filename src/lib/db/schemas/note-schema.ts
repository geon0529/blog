import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

// Notes 테이블 정의
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 실제 사용할 스키마들
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다")
    .max(200, "제목은 200자 이하여야 합니다")
    .trim(), // 공백 제거 추가s
  content: z
    .string()
    .min(1, "내용은 필수입니다")
    .max(10000, "내용은 10,000자 이하여야 합니다") // 최대 길이 추가
    .trim(), // 공백 제거 추가
});

// 업데이트용 스키마 (모든 필드 선택적)
export const updateNoteSchema = createNoteSchema.partial();

// ID 검증용 스키마
export const noteIdSchema = z.object({
  id: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 파생 타입
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type CreateNote = z.infer<typeof createNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
export type NoteId = z.infer<typeof noteIdSchema>;
