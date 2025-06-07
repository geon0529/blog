import { NextRequest, NextResponse } from "next/server";
import {
  getNotesWithPagination,
  createNote,
  searchNotes,
} from "@/lib/db/queries";
import { createNoteSchema } from "@/lib/db/schemas";
import { z } from "zod";
import { revalidateNotes } from "@/services/notes/revalidate";
import { withAuth } from "@/lib/api/middlewares/with-auth";
import { withErrorHandler } from "@/lib/api/middlewares/with-error-handler";
import { pipe } from "motion";

/**
 * GET /api/notes - 노트 목록 조회 (페이지네이션, 검색 지원)
 * 에러 처리만 적용 (인증 불필요)
 */
export const GET = withErrorHandler(
  async (request: NextRequest): Promise<NextResponse> => {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 검증 스키마
    const paginationSchema = z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(10),
      search: z.string().optional(),
      userId: z.string().optional(), // 특정 사용자 노트만 조회
    });

    const params = paginationSchema.parse({
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
      search: searchParams.get("search") || undefined,
      userId: searchParams.get("userId") || undefined,
    });

    // 도메인 로직 실행
    let result;

    if (params.search) {
      // 검색 모드
      const searchResults = await searchNotes(params.search, params.userId);

      // 검색 결과에 수동 페이지네이션 적용
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      result = {
        notes: paginatedResults,
        pagination: {
          currentPage: params.page,
          totalPages: Math.ceil(searchResults.length / params.limit),
          totalCount: searchResults.length,
          hasNextPage: endIndex < searchResults.length,
          hasPreviousPage: params.page > 1,
        },
        search: params.search,
      };
    } else {
      // 일반 페이지네이션 모드
      result = await getNotesWithPagination(
        params.page,
        params.limit,
        params.userId
      );
    }

    return NextResponse.json(result);
  }
);

/**
 * POST /api/notes - 노트 생성
 * pipe로 에러 처리 + 인증 조합
 */
export const POST = pipe(
  withErrorHandler,
  withAuth
)(async (user: any, request: NextRequest): Promise<NextResponse> => {
  const parsedRequest = await request.json();

  // 요청 데이터 검증
  const validatedData = createNoteSchema.parse({
    ...parsedRequest,
    authorId: user.id, // 인증된 사용자 ID 자동 사용
  });

  // 도메인 로직 실행
  const note = await createNote(validatedData);

  // 캐시 파괴
  revalidateNotes();

  return NextResponse.json(note, { status: 201 });
});
