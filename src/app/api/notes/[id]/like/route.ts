import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateNotes } from "@/services/notes/revalidate";
import { withAuth } from "@/lib/api/middlewares/with-auth";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";
import { flow } from "lodash";
import {
  getNoteLikeCount,
  isNoteLiked,
  toggleNoteLike,
} from "@/lib/db/queries/notes/likes";

// 파라미터 검증 스키마
const paramsSchema = z.object({
  id: z.string().uuid("올바른 노트 ID를 입력해주세요."),
});

/**
 * GET /api/notes/[id]/like - 좋아요 정보 조회
 * 에러 처리만 적용 (인증 불필요)
 *
 * 선택적 쿼리 파라미터:
 * - userId: 특정 사용자의 좋아요 상태 확인
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    const { searchParams } = new URL(request.url);

    // 파라미터 검증
    const { id: noteId } = paramsSchema.parse(params);

    // 쿼리 파라미터 검증
    const querySchema = z.object({
      userId: z.string().uuid().optional(),
    });

    const queryParams = querySchema.parse({
      userId: searchParams.get("userId") || undefined,
    });

    // 도메인 로직 실행
    const likeCount = await getNoteLikeCount(noteId);

    let isLiked = false;
    if (queryParams.userId) {
      isLiked = await isNoteLiked(noteId, queryParams.userId);
    }

    const result = {
      noteId,
      likeCount,
      isLiked,
      ...(queryParams.userId && { userId: queryParams.userId }),
    };

    return NextResponse.json(result);
  }
);

/**
 * POST /api/notes/[id]/like - 좋아요 토글
 * pipe로 에러 처리 + 인증 조합
 */
export const POST = flow(
  withAuth,
  withErrorHandler
)(async (
  user: any,
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const resolvedParams = await params;
  // 파라미터 검증
  const { id: noteId } = paramsSchema.parse(resolvedParams);

  // 도메인 로직 실행
  const result = await toggleNoteLike(noteId, user.id);

  // 캐시 파괴
  revalidateNotes();

  // 응답 구성
  const response = {
    noteId,
    userId: user.id,
    isLiked: result.isLiked,
    likeCount: result.likeCount,
    message: result.isLiked
      ? "좋아요를 추가했습니다."
      : "좋아요를 취소했습니다.",
  };

  return NextResponse.json(response);
});
