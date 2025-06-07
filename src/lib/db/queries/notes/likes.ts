import { DatabaseError, NotFoundError } from "@/lib/api/errors/domain-error";
import { db } from "../../index";
import { noteLikes, notes } from "../../schemas";
import { eq, and, count } from "drizzle-orm";

/**
 * 좋아요 추가
 */
export async function addNoteLike(
  noteId: string,
  userId: string
): Promise<boolean> {
  try {
    // 이미 좋아요했는지 확인
    const existing = await isNoteLiked(noteId, userId);
    if (existing) {
      return true; // 이미 좋아요된 상태라면 그냥 성공 반환
    }

    // 노트 존재 여부 확인
    const noteExists = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.id, noteId));

    if ((noteExists[0].count as number) === 0) {
      throw new NotFoundError("노트");
    }

    // 좋아요 추가
    await db.insert(noteLikes).values({
      noteId,
      userId,
    });

    return true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error("Database error in addNoteLike:", error);
    throw new DatabaseError(
      "좋아요 추가 중 오류가 발생했습니다.",
      "addNoteLike"
    );
  }
}

/**
 * 좋아요 취소
 */
export async function removeNoteLike(
  noteId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await db
      .delete(noteLikes)
      .where(and(eq(noteLikes.noteId, noteId), eq(noteLikes.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Database error in removeNoteLike:", error);
    throw new DatabaseError(
      "좋아요 취소 중 오류가 발생했습니다.",
      "removeNoteLike"
    );
  }
}

/**
 * 좋아요 토글 (좋아요 ↔ 취소)
 */
export async function toggleNoteLike(
  noteId: string,
  userId: string
): Promise<{
  isLiked: boolean;
  likeCount: number;
}> {
  try {
    const isLiked = await isNoteLiked(noteId, userId);

    if (isLiked) {
      await removeNoteLike(noteId, userId);
    } else {
      await addNoteLike(noteId, userId);
    }

    const likeCount = await getNoteLikeCount(noteId);

    return {
      isLiked: !isLiked,
      likeCount,
    };
  } catch (error) {
    console.error("Database error in toggleNoteLike:", error);
    throw new DatabaseError(
      "좋아요 토글 중 오류가 발생했습니다.",
      "toggleNoteLike"
    );
  }
}

/**
 * 특정 사용자가 특정 노트를 좋아요했는지 확인
 */
export async function isNoteLiked(
  noteId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await db
      .select({ count: count() })
      .from(noteLikes)
      .where(and(eq(noteLikes.noteId, noteId), eq(noteLikes.userId, userId)));

    return (result[0].count as number) > 0;
  } catch (error) {
    console.error("Database error in isNoteLiked:", error);
    throw new DatabaseError(
      "좋아요 상태 확인 중 오류가 발생했습니다.",
      "isNoteLiked"
    );
  }
}

/**
 * 특정 노트의 총 좋아요 수 조회
 */
export async function getNoteLikeCount(noteId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(noteLikes)
      .where(eq(noteLikes.noteId, noteId));

    return result[0].count as number;
  } catch (error) {
    console.error("Database error in getNoteLikeCount:", error);
    throw new DatabaseError(
      "좋아요 수 조회 중 오류가 발생했습니다.",
      "getNoteLikeCount"
    );
  }
}

/**
 * 여러 노트의 좋아요 정보 한 번에 조회 (성능 최적화용)
 */
export async function getNotesLikeInfo(
  noteIds: string[],
  userId?: string
): Promise<{
  [noteId: string]: {
    likeCount: number;
    isLiked: boolean;
  };
}> {
  try {
    // 각 노트의 좋아요 수 조회
    const likeCounts = await db
      .select({
        noteId: noteLikes.noteId,
        count: count(),
      })
      .from(noteLikes)
      .where(eq(noteLikes.noteId, noteIds[0])) // TODO: IN 연산자 사용 필요
      .groupBy(noteLikes.noteId);

    // 사용자가 좋아요한 노트들 조회 (userId가 있는 경우)
    let userLikes: string[] = [];
    if (userId) {
      const userLikeResult = await db
        .select({ noteId: noteLikes.noteId })
        .from(noteLikes)
        .where(
          and(
            eq(noteLikes.userId, userId)
            // eq(noteLikes.noteId, ... ) // TODO: IN 연산자로 noteIds 필터링
          )
        );

      userLikes = userLikeResult.map((like) => like.noteId);
    }

    // 결과 구성
    const result: {
      [noteId: string]: { likeCount: number; isLiked: boolean };
    } = {};

    noteIds.forEach((noteId) => {
      const likeInfo = likeCounts.find((item) => item.noteId === noteId);
      result[noteId] = {
        likeCount: (likeInfo?.count as number) || 0,
        isLiked: userLikes.includes(noteId),
      };
    });

    return result;
  } catch (error) {
    console.error("Database error in getNotesLikeInfo:", error);
    throw new DatabaseError(
      "노트 좋아요 정보 조회 중 오류가 발생했습니다.",
      "getNotesLikeInfo"
    );
  }
}

/**
 * 사용자가 좋아요한 노트 목록 조회 (선택적 기능)
 */
export async function getLikedNotesByUser(userId: string): Promise<string[]> {
  try {
    const result = await db
      .select({ noteId: noteLikes.noteId })
      .from(noteLikes)
      .where(eq(noteLikes.userId, userId));

    return result.map((like) => like.noteId);
  } catch (error) {
    console.error("Database error in getLikedNotesByUser:", error);
    throw new DatabaseError(
      "사용자 좋아요 노트 조회 중 오류가 발생했습니다.",
      "getLikedNotesByUser"
    );
  }
}
