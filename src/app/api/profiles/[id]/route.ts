// app/api/profiles/[id]/route.ts

import { getProfileById } from "@/lib/db/queries/profiles";
import {
  ApiError,
  errorToResponse,
  handleDomainError,
  zodErrorToResponse,
} from "@/lib/api/errors/error";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getProfileById(params.id);

    if (!profile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile });
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
