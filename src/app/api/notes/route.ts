import { NextRequest, NextResponse } from "next/server";
import {
  getNotesWithPagination,
  createNote,
  searchNotes,
} from "@/lib/db/queries";
import {
  ApiError,
  errorToResponse,
  getCurrentUser,
  handleDomainError,
  zodErrorToResponse,
} from "@/lib/errors/error";
import { createNoteSchema } from "@/lib/db/schemas";
import { z } from "zod";

/**
 * GET /api/notes - 노트 목록 조회 (페이지네이션, 검색 지원)
 */
export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    // 사용자 인증 에러
    if (error instanceof ApiError) {
      return errorToResponse(error);
    }

    // Zod 검증 에러 처리
    if (error instanceof z.ZodError) {
      return zodErrorToResponse(error);
    }

    // 도메인 에러를 API 에러로 변환 후 응답
    try {
      handleDomainError(error);
    } catch (apiError) {
      return errorToResponse(apiError as ApiError);
    }
  }
}

/**
 * POST /api/notes - 노트 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const user = await getCurrentUser();
    const parsedRequest = await request.json();
    const body = {
      ...parsedRequest,
      authorId: user.id,
    };

    // 요청 데이터 검증
    const validatedData = createNoteSchema.parse(body);

    // authorId를 현재 사용자로 설정
    const noteData = {
      ...validatedData,
      authorId: user.id,
    };

    // 도메인 로직 실행
    const note = await createNote(noteData);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    // 사용자 인증 에러
    if (error instanceof ApiError) {
      return errorToResponse(error);
    }

    // Zod 검증 에러 처리
    if (error instanceof z.ZodError) {
      return zodErrorToResponse(error);
    }

    // 도메인 에러를 API 에러로 변환
    try {
      handleDomainError(error);
    } catch (apiError) {
      return errorToResponse(apiError as ApiError);
    }
  }
}
