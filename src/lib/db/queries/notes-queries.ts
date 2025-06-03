import { db } from "../index";
import { notes, type Note, type CreateNote, type UpdateNote } from "../schema";
import { eq, desc, ilike, or, count } from "drizzle-orm";

// 모든 노트 조회
export async function getAllNotes(): Promise<Note[]> {
  return await db.select().from(notes).orderBy(desc(notes.createdAt));
}

// ID로 노트 조회 (UUID 사용)
export async function getNoteById(id: string): Promise<Note | undefined> {
  const result = await db.select().from(notes).where(eq(notes.id, id));
  return result[0];
}

// 노트 생성
export async function createNote(data: CreateNote): Promise<Note> {
  const result = await db
    .insert(notes)
    .values({
      title: data.title,
      content: data.content,
      // createdAt, updatedAt은 자동 설정됨
    })
    .returning();
  return result[0];
}

// 노트 업데이트 (중요: updatedAt 수동 설정)
export async function updateNote(
  id: string,
  data: UpdateNote
): Promise<Note | undefined> {
  const result = await db
    .update(notes)
    .set({
      ...data,
      updatedAt: new Date(), // ⚠️ 중요: 수동으로 설정해야 함
    })
    .where(eq(notes.id, id))
    .returning();
  return result[0];
}

// 노트 삭제
export async function deleteNote(id: string): Promise<boolean> {
  const result = await db.delete(notes).where(eq(notes.id, id)).returning();
  return result.length > 0;
}

// 검색 (제목 또는 내용에서)
export async function searchNotes(query: string): Promise<Note[]> {
  return await db
    .select()
    .from(notes)
    .where(
      or(ilike(notes.title, `%${query}%`), ilike(notes.content, `%${query}%`))
    )
    .orderBy(desc(notes.createdAt));
}

// 페이지네이션된 노트 조회
export async function getNotesWithPagination(
  page: number = 1,
  limit: number = 10
): Promise<{
  notes: Note[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  const offset = (page - 1) * limit;

  // 노트와 총 개수를 병렬로 조회
  const [notesResult, totalResult] = await Promise.all([
    db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(notes),
  ]);

  const totalCount = totalResult[0].count as number;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    notes: notesResult,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
