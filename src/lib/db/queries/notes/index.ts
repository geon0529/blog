import { DatabaseError, NotFoundError } from "@/lib/api/errors/domain-error";
import { db } from "../../index";
import {
  notes,
  type Note,
  type CreateNote,
  type UpdateNote,
} from "../../schemas";
import { eq, desc, ilike, or, count, and } from "drizzle-orm";
/**
 * 모든 노트 조회
 */
export async function getAllNotes(): Promise<Note[]> {
  try {
    return await db.select().from(notes).orderBy(desc(notes.createdAt));
  } catch (error) {
    console.error("Database error in getAllNotes:", error);
    throw new DatabaseError(
      "노트 목록을 불러오는 중 오류가 발생했습니다.",
      "getAllNotes"
    );
  }
}

/**
 * 특정 사용자의 노트만 조회
 */
export async function getNotesByUserId(userId: string): Promise<Note[]> {
  try {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.authorId, userId))
      .orderBy(desc(notes.createdAt));
  } catch (error) {
    console.error("Database error in getNotesByUserId:", error);
    throw new DatabaseError(
      "사용자 노트를 불러오는 중 오류가 발생했습니다.",
      "getNotesByUserId"
    );
  }
}

/**
 * ID로 노트 조회
 */
export async function getNoteById(id: string): Promise<Note | undefined> {
  try {
    const result = await db.select().from(notes).where(eq(notes.id, id));
    return result[0];
  } catch (error) {
    console.error("Database error in getNoteById:", error);
    throw new DatabaseError(
      "노트를 불러오는 중 오류가 발생했습니다.",
      "getNoteById"
    );
  }
}

/**
 * 노트 생성
 */
export async function createNote(data: CreateNote): Promise<Note> {
  try {
    const result = await db
      .insert(notes)
      .values({
        title: data.title,
        content: data.content,
        authorId: data.authorId,
      })
      .returning();

    if (result.length === 0) {
      throw new DatabaseError("노트 생성에 실패했습니다.", "createNote");
    }

    return result[0];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error("Database error in createNote:", error);
    throw new DatabaseError(
      "노트 생성 중 데이터베이스 오류가 발생했습니다.",
      "createNote"
    );
  }
}

/**
 * 노트 업데이트 (순수 데이터 업데이트만)
 */
export async function updateNote(id: string, data: UpdateNote): Promise<Note> {
  try {
    const result = await db
      .update(notes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("노트");
    }

    return result[0];
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error("Database error in updateNote:", error);
    throw new DatabaseError(
      "노트 수정 중 데이터베이스 오류가 발생했습니다.",
      "updateNote"
    );
  }
}

/**
 * 노트 삭제 (순수 데이터 삭제만)
 */
export async function deleteNote(id: string): Promise<boolean> {
  try {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundError("노트");
    }

    return true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error("Database error in deleteNote:", error);
    throw new DatabaseError(
      "노트 삭제 중 데이터베이스 오류가 발생했습니다.",
      "deleteNote"
    );
  }
}

// ================================================================
// 검색 및 조회 함수들
// ================================================================

/**
 * 검색 (제목 또는 내용에서) - 선택적으로 사용자별 필터링
 */
export async function searchNotes(
  query: string,
  userId?: string
): Promise<Note[]> {
  try {
    const searchCondition = or(
      ilike(notes.title, `%${query}%`),
      ilike(notes.content, `%${query}%`)
    );

    const whereCondition = userId
      ? and(searchCondition, eq(notes.authorId, userId))
      : searchCondition;

    return await db
      .select()
      .from(notes)
      .where(whereCondition)
      .orderBy(desc(notes.createdAt));
  } catch (error) {
    console.error("Database error in searchNotes:", error);
    throw new DatabaseError("노트 검색 중 오류가 발생했습니다.", "searchNotes");
  }
}

/**
 * 페이지네이션된 노트 조회 - 선택적으로 사용자별 필터링
 */
export async function getNotesWithPagination(
  page: number = 1,
  limit: number = 10,
  userId?: string
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
  try {
    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    const whereCondition = userId ? eq(notes.authorId, userId) : undefined;

    // 노트와 총 개수를 병렬로 조회
    const [notesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(notes)
        .where(whereCondition)
        .orderBy(desc(notes.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(notes).where(whereCondition),
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
  } catch (error) {
    console.error("Database error in getNotesWithPagination:", error);
    throw new DatabaseError(
      "노트 목록을 불러오는 중 오류가 발생했습니다.",
      "getNotesWithPagination"
    );
  }
}

// ================================================================
// 통계 및 분석 함수들
// ================================================================

/**
 * 사용자별 노트 개수 조회
 */
export async function getNoteCountByUser(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.authorId, userId));

    return result[0].count as number;
  } catch (error) {
    console.error("Database error in getNoteCountByUser:", error);
    throw new DatabaseError(
      "사용자 노트 개수를 조회하는 중 오류가 발생했습니다.",
      "getNoteCountByUser"
    );
  }
}

/**
 * 전체 노트 통계
 */
export async function getNoteStats(): Promise<{
  totalNotes: number;
  totalUsers: number;
  notesToday: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalNotes, uniqueUsers, notesToday] = await Promise.all([
      db.select({ count: count() }).from(notes),
      db.select({ count: count(notes.authorId) }).from(notes), // TODO: DISTINCT 처리 필요
      db
        .select({ count: count() })
        .from(notes)
        .where(
          and(
            eq(notes.createdAt, today)
            // 오늘 하루 범위로 검색하려면 범위 조건 필요
          )
        ),
    ]);

    return {
      totalNotes: totalNotes[0].count as number,
      totalUsers: uniqueUsers[0].count as number, // 정확하지 않음, 별도 users 테이블 필요
      notesToday: notesToday[0].count as number,
    };
  } catch (error) {
    console.error("Database error in getNoteStats:", error);
    throw new DatabaseError(
      "노트 통계를 조회하는 중 오류가 발생했습니다.",
      "getNoteStats"
    );
  }
}

/**
 * 최근 노트 조회 (제한된 개수)
 */
export async function getRecentNotes(
  limit: number = 5,
  userId?: string
): Promise<Note[]> {
  try {
    const whereCondition = userId ? eq(notes.authorId, userId) : undefined;

    return await db
      .select()
      .from(notes)
      .where(whereCondition)
      .orderBy(desc(notes.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Database error in getRecentNotes:", error);
    throw new DatabaseError(
      "최근 노트를 조회하는 중 오류가 발생했습니다.",
      "getRecentNotes"
    );
  }
}

/**
 * 노트 존재 여부 확인
 */
export async function noteExists(id: string): Promise<boolean> {
  try {
    const result = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.id, id));

    return (result[0].count as number) > 0;
  } catch (error) {
    console.error("Database error in noteExists:", error);
    throw new DatabaseError(
      "노트 존재 여부를 확인하는 중 오류가 발생했습니다.",
      "noteExists"
    );
  }
}

/**
 * 특정 사용자가 특정 노트의 소유자인지 확인
 */
export async function isNoteOwner(
  noteId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await db
      .select({ count: count() })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.authorId, userId)));

    return (result[0].count as number) > 0;
  } catch (error) {
    console.error("Database error in isNoteOwner:", error);
    throw new DatabaseError(
      "노트 소유자 확인 중 오류가 발생했습니다.",
      "isNoteOwner"
    );
  }
}
