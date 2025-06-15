import { notes } from "@/lib/db/schemas/notes";
import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

// Tags 테이블
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notes-Tags 연결 테이블 (다대다 관계)
export const notesToTags = pgTable("notes_to_tags", {
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// Relations 설정
export const tagsRelations = relations(tags, ({ many }) => ({
  notes: many(notesToTags),
}));

export const notesToTagsRelations = relations(notesToTags, ({ one }) => ({
  note: one(notes, {
    fields: [notesToTags.noteId],
    references: [notes.id],
  }),
  tag: one(tags, {
    fields: [notesToTags.tagId],
    references: [tags.id],
  }),
}));

// Zod 스키마
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "태그 이름은 필수입니다")
    .max(50, "태그 이름은 50자 이하여야 합니다")
    .trim(),
});

export const tagIdSchema = z.object({
  id: z.string().uuid("올바른 UUID 형식이 아닙니다"),
});

// 타입 정의
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type CreateTag = z.infer<typeof createTagSchema>;
export type TagId = z.infer<typeof tagIdSchema>;
