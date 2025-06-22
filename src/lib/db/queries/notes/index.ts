import { DatabaseError, NotFoundError } from "@/lib/api/errors/domain-error";
import { db } from "../../index";
import {
  notes,
  noteLikes,
  profiles, // 유저 정보 가져오기 위해 필요
  tags,
  notesToTags,
  type CreateNote,
  type UpdateNote,
} from "../../schemas";
import { eq, desc, ilike, or, count, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

/* 태그 정보 타입 */
type TagInfo = {
  id: string;
  name: string;
};

/* 좋아요 정보가 포함된 노트 타입 (기본 타입으로 사용) */
export type Note = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  likes: {
    count: number;
    users: {
      id: string;
      email: string;
    }[];
  };
  tags: TagInfo[]; // 태그 정보 추가
};

/**
 * 노트들의 좋아요 정보를 가져오는 헬퍼 함수
 */
async function getNotesLikesInfo(noteIds: string[]): Promise<{
  [noteId: string]: {
    count: number;
    users: { id: string; email: string }[];
  };
}> {
  if (noteIds.length === 0) return {};

  try {
    // 좋아요 정보와 유저 정보를 join해서 가져오기
    const likesWithUsers = await db
      .select({
        noteId: noteLikes.noteId,
        userId: noteLikes.userId,
        userEmail: profiles.email,
      })
      .from(noteLikes)
      .innerJoin(profiles, eq(noteLikes.userId, profiles.id))
      .where(inArray(noteLikes.noteId, noteIds));

    // 노트별로 그룹화
    const result: {
      [noteId: string]: {
        count: number;
        users: Array<{ id: string; email: string }>;
      };
    } = {};

    // 초기화
    noteIds.forEach((noteId) => {
      result[noteId] = { count: 0, users: [] };
    });

    // 데이터 집계
    likesWithUsers.forEach((like) => {
      // email이 null인 경우 스킵
      if (!like.userEmail) return;

      if (!result[like.noteId]) {
        result[like.noteId] = { count: 0, users: [] };
      }

      result[like.noteId].count++;
      result[like.noteId].users.push({
        id: like.userId,
        email: like.userEmail,
      });
    });

    return result;
  } catch (error) {
    console.error("Error fetching notes likes info:", error);
    return {};
  }
}

/**
 * 노트들의 태그 정보를 가져오는 헬퍼 함수
 */
async function getNotesTagsInfo(noteIds: string[]): Promise<{
  [noteId: string]: TagInfo[];
}> {
  if (noteIds.length === 0) return {};

  try {
    const tagsWithNotes = await db
      .select({
        noteId: notesToTags.noteId,
        tagId: tags.id,
        tagName: tags.name,
      })
      .from(notesToTags)
      .innerJoin(tags, eq(notesToTags.tagId, tags.id))
      .where(inArray(notesToTags.noteId, noteIds));

    const result: { [noteId: string]: TagInfo[] } = {};

    // 초기화
    noteIds.forEach((noteId) => {
      result[noteId] = [];
    });

    // 데이터 집계
    tagsWithNotes.forEach((tag) => {
      if (!result[tag.noteId]) {
        result[tag.noteId] = [];
      }
      result[tag.noteId].push({
        id: tag.tagId,
        name: tag.tagName,
      });
    });

    return result;
  } catch (error) {
    console.error("Error fetching notes tags info:", error);
    return {};
  }
}

/**
 * 원본 노트 배열에 좋아요와 태그 정보 추가하는 헬퍼
 */
async function addMetadataToNotes(rawNotes: any[]): Promise<Note[]> {
  const noteIds = rawNotes.map((note) => note.id);
  const [likesInfo, tagsInfo] = await Promise.all([
    getNotesLikesInfo(noteIds),
    getNotesTagsInfo(noteIds),
  ]);

  return rawNotes.map((note) => ({
    ...note,
    likes: likesInfo[note.id] || { count: 0, users: [] },
    tags: tagsInfo[note.id] || [],
  }));
}

/**
 * 모든 노트 조회
 */
export async function getAllNotes(): Promise<Note[]> {
  try {
    const rawNotes = await db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt));

    return await addMetadataToNotes(rawNotes);
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
    const rawNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.authorId, userId))
      .orderBy(desc(notes.createdAt));

    return await addMetadataToNotes(rawNotes);
  } catch (error) {
    console.error("Database error in getNotesByUserId:", error);
    throw new DatabaseError(
      "사용자 노트를 불러오는 중 오류가 발생했습니다.",
      "getNotesByUserId"
    );
  }
}

/**
 * ID로 노트 조회 (조회수 증가 없이)
 */
export async function getNoteByIdReadOnly(
  id: string
): Promise<Note | undefined> {
  try {
    const result = await db.select().from(notes).where(eq(notes.id, id));

    if (result.length === 0) {
      return undefined;
    }

    // 메타데이터 추가하여 반환
    const notesWithMetadata = await addMetadataToNotes(result);
    return notesWithMetadata[0];
  } catch (error) {
    console.error("Database error in getNoteByIdReadOnly:", error);
    throw new DatabaseError(
      "노트를 불러오는 중 오류가 발생했습니다.",
      "getNoteByIdReadOnly"
    );
  }
}

/**
 * 노트 조회수 증가
 */
export async function incrementNoteViewCount(id: string): Promise<void> {
  try {
    await db
      .update(notes)
      .set({
        viewCount: sql`${notes.viewCount} + 1`,
      })
      .where(eq(notes.id, id));
  } catch (error) {
    console.error("Database error in incrementNoteViewCount:", error);
    throw new DatabaseError(
      "조회수 업데이트 중 오류가 발생했습니다.",
      "incrementNoteViewCount"
    );
  }
}

/**
 * ID로 노트 조회 (기존 함수 - 하위 호환성 유지)
 */
export async function getNoteById(id: string): Promise<Note | undefined> {
  try {
    return await db.transaction(async (tx) => {
      // 1. 노트 조회
      const result = await tx.select().from(notes).where(eq(notes.id, id));

      if (result.length === 0) {
        return undefined;
      }

      // 2. 조회수 증가
      await tx
        .update(notes)
        .set({
          viewCount: sql`${notes.viewCount} + 1`,
        })
        .where(eq(notes.id, id));

      // 3. 메타데이터 추가하여 반환
      const notesWithMetadata = await addMetadataToNotes(result);
      return notesWithMetadata[0];
    });
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
    return await db.transaction(async (tx) => {
      // 1. 노트 생성
      const [note] = await tx
        .insert(notes)
        .values({
          title: data.title,
          content: data.content,
          authorId: data.authorId,
        })
        .returning();

      if (!note) {
        throw new DatabaseError("노트 생성에 실패했습니다.", "createNote");
      }

      // 2. 태그 처리
      if (data.tags && data.tags.length > 0) {
        // 2-1. 기존 태그 조회 또는 새 태그 생성
        const tagPromises = data.tags.map(async (tagName) => {
          const existingTag = await tx.query.tags.findFirst({
            where: eq(tags.name, tagName),
          });

          if (existingTag) {
            return existingTag;
          }

          const [newTag] = await tx
            .insert(tags)
            .values({ name: tagName })
            .returning();
          return newTag;
        });

        const processedTags = await Promise.all(tagPromises);

        // 2-2. 노트와 태그 연결
        await tx.insert(notesToTags).values(
          processedTags.map((tag) => ({
            noteId: note.id,
            tagId: tag.id,
          }))
        );
      }

      // 3. 생성된 노트에 메타데이터(좋아요, 태그) 추가
      const notesWithMetadata = await addMetadataToNotes([note]);
      return notesWithMetadata[0];
    });
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
 * 노트 업데이트 (제목, 내용, 태그 업데이트)
 */
export async function updateNote(id: string, data: UpdateNote): Promise<Note> {
  try {
    return await db.transaction(async (tx) => {
      // 1. 노트 기본 정보 업데이트
      const [note] = await tx
        .update(notes)
        .set({
          title: data.title,
          content: data.content,
          updatedAt: new Date(),
        })
        .where(eq(notes.id, id))
        .returning();

      if (!note) {
        throw new NotFoundError("노트");
      }

      // 2. 태그 업데이트 (태그가 제공된 경우에만)
      if (data.tags !== undefined) {
        // 2-1. 기존 태그 연결 삭제
        await tx.delete(notesToTags).where(eq(notesToTags.noteId, id));

        // 2-2. 새 태그 처리
        if (data.tags.length > 0) {
          // 기존 태그 조회 또는 새 태그 생성
          const tagPromises = data.tags.map(async (tagName) => {
            const existingTag = await tx.query.tags.findFirst({
              where: eq(tags.name, tagName),
            });

            if (existingTag) {
              return existingTag;
            }

            const [newTag] = await tx
              .insert(tags)
              .values({ name: tagName })
              .returning();
            return newTag;
          });

          const processedTags = await Promise.all(tagPromises);

          // 새 태그 연결 생성
          await tx.insert(notesToTags).values(
            processedTags.map((tag) => ({
              noteId: id,
              tagId: tag.id,
            }))
          );
        }
      }

      // 3. 업데이트된 노트에 메타데이터 추가
      const notesWithMetadata = await addMetadataToNotes([note]);
      return notesWithMetadata[0];
    });
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
 * 노트 삭제
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

    const rawNotes = await db
      .select()
      .from(notes)
      .where(whereCondition)
      .orderBy(desc(notes.createdAt));

    return await addMetadataToNotes(rawNotes);
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
    // 1. 전체 노트 개수 조회
    const whereCondition = userId ? eq(notes.authorId, userId) : undefined;
    const totalCountResult = await db
      .select({ count: count() })
      .from(notes)
      .where(whereCondition);

    const totalCount = totalCountResult[0].count as number;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // 2. 페이지네이션된 노트 조회
    const rawNotes = await db
      .select()
      .from(notes)
      .where(whereCondition)
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);

    // 3. 좋아요/태그 정보 추가
    const notesWithMetadata = await addMetadataToNotes(rawNotes);

    return {
      notes: notesWithMetadata,
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

/**
 * 태그로 노트 검색
 */
export async function searchNotesByTags(
  tagNames: string[],
  userId?: string
): Promise<Note[]> {
  try {
    const tagConditions = tagNames.map((name) => eq(tags.name, name));
    const whereCondition = userId
      ? and(eq(notes.authorId, userId), or(...tagConditions))
      : or(...tagConditions);

    const rawNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        authorId: notes.authorId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .innerJoin(notesToTags, eq(notes.id, notesToTags.noteId))
      .innerJoin(tags, eq(notesToTags.tagId, tags.id))
      .where(whereCondition)
      .groupBy(notes.id)
      .having(sql`count(distinct ${tags.id}) = ${tagNames.length}`)
      .orderBy(desc(notes.createdAt));

    return await addMetadataToNotes(rawNotes);
  } catch (error) {
    console.error("Database error in searchNotesByTags:", error);
    throw new DatabaseError(
      "태그로 노트 검색 중 오류가 발생했습니다.",
      "searchNotesByTags"
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

    const rawNotes = await db
      .select()
      .from(notes)
      .where(whereCondition)
      .orderBy(desc(notes.createdAt))
      .limit(limit);

    return await addMetadataToNotes(rawNotes);
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
